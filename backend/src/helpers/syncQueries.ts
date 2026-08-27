import { Transaction } from 'sequelize';
import {
  sequelize,
  WorkOrder,
  WorkOrderChecklist,
  WorkOrderConflict,
  WorkOrderNote,
  WorkOrderReading,
  WorkOrderAttachment,
} from '../models';
import type { WorkOrderStatus } from '../models/workOrder';
import type { WorkOrder as WorkOrderType } from '../models/workOrder';
import { ROLES, type Role } from '../config/constants';
import { deleteFileFromS3 } from '../config/s3';
import { recordWorkOrderHistory } from './historyQueries';
import {
  claimSyncOperation,
  completeSyncOperation,
  releaseSyncOperation,
  stableHash,
} from './syncOperationQueries';
import { isValidUuid } from '../utils';

export interface BatchMutation {
  mutationId: string;
  workOrderId: string;
  actionType: 'UPDATE_STATUS' | 'COMPLETE_JOB' | 'UPDATE_CHECKLIST' | 'ADD_NOTE' | 'ADD_READING' | 'DELETE_ATTACHMENT';
  payload: Record<string, any>;
  baseVersion?: number;
  timestamp: number;
}
export interface SyncActor {
  id: string;
  role: Role;
}

export interface BatchMutationResult {
  mutationId: string;
  status: 'SYNCED' | 'FAILED' | 'CONFLICT';
  errorMessage?: string;
  currentVersion?: number;
  serverData?: any;
}

type AuthorizationResult =
  | { ok: true; workOrder: WorkOrderType }
  | { ok: false; reason: 'NOT_FOUND' | 'FORBIDDEN' };

export const getAuthorizedWorkOrder = async (
  actor: SyncActor,
  workOrderId: string,
  transaction: Transaction,
): Promise<AuthorizationResult> => {
  const wo = await WorkOrder.findByPk(workOrderId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  if (!wo) return { ok: false, reason: 'NOT_FOUND' };

  if (actor.role === ROLES.ADMIN_DISPATCHER || wo.technicianId === actor.id) {
    return { ok: true, workOrder: wo as unknown as WorkOrderType };
  }

  return { ok: false, reason: 'FORBIDDEN' };
};

const failed = (mutationId: string, errorMessage: string): BatchMutationResult => ({
  mutationId,
  status: 'FAILED',
  errorMessage,
});


const persistConflictRecord = async (
  mutation: BatchMutation,
  actor: SyncActor,
  result: BatchMutationResult,
  transaction?: Transaction,
): Promise<void> => {
  try {
    await WorkOrderConflict.findOrCreate({
      where: { mutationId: mutation.mutationId },
      defaults: {
        mutationId: mutation.mutationId,
        workOrderId: mutation.workOrderId,
        actorId: actor.id,
        actionType: mutation.actionType,
        localPayload: mutation.payload,
        baseVersion: mutation.baseVersion ?? null,
        serverVersion: result.currentVersion ?? null,
        serverSnapshot: result.serverData ?? null,
        reason:
          result.errorMessage ||
          'Work order was modified on the server while this change was queued offline',
        status: 'PENDING',
      },
      transaction,
    });
  } catch {
    // Recording the conflict must never mask the CONFLICT result itself.
  }
};

export const executeSingleMutation = async (
  mutation: BatchMutation,
  actor: SyncActor,
): Promise<BatchMutationResult> => {
  const requestHash = stableHash({
    workOrderId: mutation.workOrderId,
    actionType: mutation.actionType,
    payload: mutation.payload,
    baseVersion: mutation.baseVersion ?? null,
  });

  let claim: Awaited<ReturnType<typeof claimSyncOperation>>;
  try {
    claim = await claimSyncOperation({
      actorId: actor.id,
      mutationId: mutation.mutationId,
      workOrderId: mutation.workOrderId,
      operationType: mutation.actionType,
      requestHash,
    });
  } catch (err) {
    console.error('Failed to claim sync operation:', err);
    return failed(mutation.mutationId, 'Idempotency store unavailable, retry later');
  }

  if (claim.type === 'REPLAY' && claim.responsePayload) {
    return claim.responsePayload as BatchMutationResult;
  }
  if (claim.type === 'HASH_MISMATCH') {
    return failed(mutation.mutationId, 'Mutation ID was reused with a different payload');
  }
  if (claim.type === 'IN_PROGRESS') {
    return failed(mutation.mutationId, 'Duplicate delivery: this mutation is already being processed');
  }

  const newClaim = claim as { type: 'NEW'; operationId: string };

  try {
    return await sequelize.transaction(async (t) => {
      const result = await applyMutationInTransaction(mutation, actor, t);

      if (result.status === 'CONFLICT') {
        await persistConflictRecord(mutation, actor, result, t);
      }

      await completeSyncOperation(newClaim.operationId, 'SUCCEEDED', result, t);
      return result;
    });
  } catch (err: any) {
    await releaseSyncOperation(newClaim.operationId).catch(() => {});
    return failed(mutation.mutationId, err?.message || 'Failed to apply mutation');
  }
};

const applyMutationInTransaction = async (
  mutation: BatchMutation,
  actor: SyncActor,
  t: Transaction,
): Promise<BatchMutationResult> => {
  const { actionType, workOrderId, payload, baseVersion } = mutation;

  const authorization = await getAuthorizedWorkOrder(actor, workOrderId, t);

  if (!authorization.ok) {
    return failed(
      mutation.mutationId,
      authorization.reason === 'FORBIDDEN'
        ? 'Forbidden: work order is not assigned to you'
        : 'Work order not found',
    );
  }

  const wo = authorization.workOrder;
  const actorId = actor.id;

  if (actionType === 'UPDATE_STATUS' || actionType === 'COMPLETE_JOB') {
    if (wo.status === 'CANCELLED') {
      return {
        mutationId: mutation.mutationId,
        status: 'CONFLICT',
        errorMessage: 'Work order was cancelled by dispatcher while change was queued offline',
        currentVersion: wo.version,
        serverData: wo.toJSON(),
      };
    }

    if (baseVersion !== undefined && baseVersion !== null && (wo.version || 1) > baseVersion) {
      return {
        mutationId: mutation.mutationId,
        status: 'CONFLICT',
        errorMessage: 'Work order was updated on the server by another user while offline',
        currentVersion: wo.version,
        serverData: wo.toJSON(),
      };
    }

    const newVersion = (wo.version || 1) + 1;

    if (actionType === 'UPDATE_STATUS') {
      const updateData: any = { status: payload.status as WorkOrderStatus, version: newVersion };
      if (payload.status === 'COMPLETED' && !wo.completedAt) {
        updateData.completedAt = new Date();
      }
      await wo.update(updateData, { transaction: t });

      await recordWorkOrderHistory({
        workOrderId,
        userId: actorId,
        action: 'STATUS_CHANGED',
        description: `Work order status changed to ${payload.status} (via offline sync).`,
        metadata: { status: payload.status, offlineSync: true },
        transaction: t,
      });
    } else {
      await wo.update(
        {
          status: 'COMPLETED',
          completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
          version: newVersion,
        },
        { transaction: t },
      );

      await recordWorkOrderHistory({
        workOrderId,
        userId: actorId,
        action: 'JOB_COMPLETED',
        description: 'Job completed (via offline sync).',
        metadata: { completedAt: payload.completedAt, offlineSync: true },
        transaction: t,
      });
    }

    return { mutationId: mutation.mutationId, status: 'SYNCED', currentVersion: newVersion };
  }

  if (actionType === 'UPDATE_CHECKLIST') {
    if (!payload.checklistId) {
      return failed(mutation.mutationId, 'Checklist mutation is missing checklistId');
    }
    
    const item = await WorkOrderChecklist.findOne({
      where: { id: payload.checklistId, workOrderId },
      transaction: t,
    });
    if (!item) {
      return failed(mutation.mutationId, 'Checklist item not found on this work order');
    }

    await item.update(
      {
        isCompleted: Boolean(payload.isCompleted),
        completedAt: payload.isCompleted ? new Date() : null,
      },
      { transaction: t },
    );

    await recordWorkOrderHistory({
      workOrderId,
      userId: actorId,
      action: 'CHECKLIST_UPDATED',
      description: payload.isCompleted
        ? 'Checklist task completed (via offline sync).'
        : 'Checklist task unmarked (via offline sync).',
      metadata: { checklistId: payload.checklistId, isCompleted: Boolean(payload.isCompleted), offlineSync: true },
      transaction: t,
    });

    return { mutationId: mutation.mutationId, status: 'SYNCED', currentVersion: wo.version };
  }

  if (actionType === 'ADD_NOTE') {
    if (!payload.content) {
      return failed(mutation.mutationId, 'Note mutation is missing content');
    }

    await WorkOrderNote.create(
      {
        id: isValidUuid(payload.id) ? payload.id : undefined,
        workOrderId,
        userId: actorId,
        content: String(payload.content).trim(),
        type: payload.type || 'NOTE',
      },
      { transaction: t },
    );

    await recordWorkOrderHistory({
      workOrderId,
      userId: actorId,
      action: 'NOTE_ADDED',
      description: 'Field note added (via offline sync).',
      metadata: { noteId: payload.id, offlineSync: true },
      transaction: t,
    });

    return { mutationId: mutation.mutationId, status: 'SYNCED', currentVersion: wo.version };
  }

  if (actionType === 'ADD_READING') {
    if (!payload.metric || !payload.value || !payload.unit) {
      return failed(mutation.mutationId, 'Reading mutation is missing metric, value or unit');
    }

    await WorkOrderReading.create(
      {
        id: isValidUuid(payload.id) ? payload.id : undefined,
        workOrderId,
        userId: actorId,
        metric: String(payload.metric).trim(),
        value: String(payload.value).trim(),
        unit: String(payload.unit).trim(),
        recordedAt: payload.recordedAt ? new Date(payload.recordedAt) : new Date(),
      },
      { transaction: t },
    );

    await recordWorkOrderHistory({
      workOrderId,
      userId: actorId,
      action: 'READING_LOGGED',
      description: `Reading logged: ${payload.metric} (${payload.value} ${payload.unit}).`,
      metadata: {
        metric: payload.metric,
        value: payload.value,
        unit: payload.unit,
        offlineSync: true,
      },
      transaction: t,
    });

    return { mutationId: mutation.mutationId, status: 'SYNCED', currentVersion: wo.version };
  }

  if (actionType === 'DELETE_ATTACHMENT') {
    const attachmentId = payload.attachmentId || payload.id;
    if (!attachmentId) {
      return failed(mutation.mutationId, 'Delete attachment mutation is missing attachmentId');
    }

    const attachment = await WorkOrderAttachment.findOne({
      where: { id: attachmentId, workOrderId },
      transaction: t,
    });

    if (attachment) {
      if (attachment.technicianId && attachment.technicianId !== actor.id) {
        return failed(mutation.mutationId, 'Forbidden: You can only delete your own attachments');
      }

      if (attachment.fileUrl) {
        await deleteFileFromS3(attachment.fileUrl).catch(() => {});
      }

      await attachment.destroy({ transaction: t });

      await recordWorkOrderHistory({
        workOrderId,
        userId: actorId,
        action: 'PHOTO_DELETED',
        description: `Photo attachment '${attachment.fileName}' deleted (via offline sync).`,
        metadata: { attachmentId, fileName: attachment.fileName, offlineSync: true },
        transaction: t,
      });
    }

    return { mutationId: mutation.mutationId, status: 'SYNCED', currentVersion: wo.version };
  }

  return failed(mutation.mutationId, `Unsupported action type: ${actionType}`);
};

export const processBatchMutations = async (
  mutations: BatchMutation[],
  actor: SyncActor,
): Promise<BatchMutationResult[]> => {
  const results: BatchMutationResult[] = [];
  for (const mutation of mutations) {
    const result = await executeSingleMutation(mutation, actor);
    results.push(result);
  }
  return results;
};
