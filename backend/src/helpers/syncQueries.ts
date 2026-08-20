import { Transaction } from 'sequelize';
import { sequelize, WorkOrder, WorkOrderChecklist, WorkOrderNote, WorkOrderReading } from '../models';
import type { WorkOrderStatus } from '../models/workOrder';
import { recordWorkOrderHistory } from './historyQueries';

export interface BatchMutation {
  mutationId: string;
  workOrderId: string;
  actionType: 'UPDATE_STATUS' | 'COMPLETE_JOB' | 'UPDATE_CHECKLIST' | 'ADD_NOTE' | 'ADD_READING';
  payload: Record<string, any>;
  baseVersion?: number;
  timestamp: number;
}

export interface BatchMutationResult {
  mutationId: string;
  status: 'SYNCED' | 'FAILED' | 'CONFLICT';
  errorMessage?: string;
  currentVersion?: number;
  serverData?: any;
}

export const applyStatusMutation = async (
  workOrderId: string,
  status: WorkOrderStatus,
  baseVersion?: number,
  transaction?: Transaction,
): Promise<{ success: boolean; conflict?: boolean; currentVersion?: number; serverData?: any }> => {
  const wo = await WorkOrder.findByPk(workOrderId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!wo) return { success: false };

  if (baseVersion !== undefined && baseVersion !== null && (wo.version || 1) > baseVersion) {
    return {
      success: false,
      conflict: true,
      currentVersion: wo.version,
      serverData: wo.toJSON(),
    };
  }

  const newVersion = (wo.version || 1) + 1;
  const updateData: any = { status, version: newVersion };
  if (status === 'COMPLETED' && !wo.completedAt) {
    updateData.completedAt = new Date();
  }
  await wo.update(updateData, { transaction });
  return { success: true, currentVersion: newVersion };
};

export const applyCompleteJobMutation = async (
  workOrderId: string,
  completedAt?: string,
  baseVersion?: number,
  transaction?: Transaction,
): Promise<{ success: boolean; conflict?: boolean; currentVersion?: number; serverData?: any }> => {
  const wo = await WorkOrder.findByPk(workOrderId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  if (!wo) return { success: false };

  if (baseVersion !== undefined && baseVersion !== null && (wo.version || 1) > baseVersion) {
    return {
      success: false,
      conflict: true,
      currentVersion: wo.version,
      serverData: wo.toJSON(),
    };
  }

  const newVersion = (wo.version || 1) + 1;
  await wo.update(
    {
      status: 'COMPLETED',
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      version: newVersion,
    },
    { transaction },
  );
  return { success: true, currentVersion: newVersion };
};

export const applyChecklistMutation = async (
  checklistId: string,
  isCompleted: boolean,
  transaction?: Transaction,
): Promise<boolean> => {
  const item = await WorkOrderChecklist.findByPk(checklistId, { transaction });
  if (!item) return false;

  await item.update(
    {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    { transaction },
  );
  return true;
};

const isValidUuid = (val: any): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const executeSingleMutation = async (mutation: BatchMutation): Promise<BatchMutationResult> => {
  let conflictDetails: { conflict?: boolean; currentVersion?: number; serverData?: any } | null = null;

  try {
    await sequelize.transaction(async (t) => {
      const { actionType, workOrderId, payload, baseVersion } = mutation;
      const rawUserId = (mutation as any).userId || payload.userId || null;
      const mutationUserId = isValidUuid(rawUserId) ? rawUserId : null;

      if (actionType === 'UPDATE_STATUS') {
        const res = await applyStatusMutation(workOrderId, payload.status as WorkOrderStatus, baseVersion, t);
        if (res.conflict) {
          conflictDetails = res;
          throw new Error('OCC_CONFLICT');
        }

        await recordWorkOrderHistory({
          workOrderId,
          userId: mutationUserId,
          action: 'STATUS_CHANGED',
          description: `Work order status changed to ${payload.status} (via offline sync).`,
          metadata: { status: payload.status, offlineSync: true },
          transaction: t,
        });
      } else if (actionType === 'COMPLETE_JOB') {
        const res = await applyCompleteJobMutation(workOrderId, payload.completedAt, baseVersion, t);
        if (res.conflict) {
          conflictDetails = res;
          throw new Error('OCC_CONFLICT');
        }

        await recordWorkOrderHistory({
          workOrderId,
          userId: mutationUserId,
          action: 'JOB_COMPLETED',
          description: 'Job completed (via offline sync).',
          metadata: { completedAt: payload.completedAt, offlineSync: true },
          transaction: t,
        });
      } else if (actionType === 'UPDATE_CHECKLIST') {
        if (payload.checklistId) {
          await applyChecklistMutation(payload.checklistId, Boolean(payload.isCompleted), t);

          await recordWorkOrderHistory({
            workOrderId,
            userId: mutationUserId,
            action: 'CHECKLIST_UPDATED',
            description: payload.isCompleted
              ? 'Checklist task completed (via offline sync).'
              : 'Checklist task unmarked (via offline sync).',
            metadata: { checklistId: payload.checklistId, isCompleted: payload.isCompleted, offlineSync: true },
            transaction: t,
          });
        }
      } else if (actionType === 'ADD_NOTE') {
        if (payload.content) {
          const rawAuthor = payload.userId || (mutation as any).userId;
          const authorId = isValidUuid(rawAuthor) ? rawAuthor : null;
          const noteId = isValidUuid(payload.id) ? payload.id : undefined;

          await WorkOrderNote.create(
            {
              id: noteId,
              workOrderId,
              userId: authorId,
              content: payload.content.trim(),
              type: payload.type || 'NOTE',
            },
            { transaction: t },
          );

          await recordWorkOrderHistory({
            workOrderId,
            userId: authorId,
            action: 'NOTE_ADDED',
            description: 'Field note added (via offline sync).',
            metadata: { noteId: payload.id, offlineSync: true },
            transaction: t,
          });
        }
      } else if (actionType === 'ADD_READING') {
        if (payload.metric && payload.value && payload.unit) {
          const rawAuthor = payload.userId || (mutation as any).userId;
          const authorId = isValidUuid(rawAuthor) ? rawAuthor : null;
          const readingId = isValidUuid(payload.id) ? payload.id : undefined;

          const newReading = await WorkOrderReading.create(
            {
              id: readingId,
              workOrderId,
              userId: authorId,
              metric: payload.metric.trim(),
              value: payload.value.trim(),
              unit: payload.unit.trim(),
              recordedAt: payload.recordedAt ? new Date(payload.recordedAt) : new Date(),
            },
            { transaction: t },
          );

          await recordWorkOrderHistory({
            workOrderId,
            userId: authorId,
            action: 'READING_LOGGED',
            description: `Reading logged: ${payload.metric} (${payload.value} ${payload.unit}).`,
            metadata: {
              readingId: newReading.id,
              metric: payload.metric,
              value: payload.value,
              unit: payload.unit,
              offlineSync: true,
            },
            transaction: t,
          });
        }
      }
    });

    return {
      mutationId: mutation.mutationId,
      status: 'SYNCED',
    };
  } catch (err: any) {
    if (err.message === 'OCC_CONFLICT' && conflictDetails) {
      const details = conflictDetails as { currentVersion?: number; serverData?: any };
      return {
        mutationId: mutation.mutationId,
        status: 'CONFLICT',
        errorMessage: 'Work order was updated on the server by another user while offline',
        currentVersion: details.currentVersion,
        serverData: details.serverData,
      };
    }

    return {
      mutationId: mutation.mutationId,
      status: 'FAILED',
      errorMessage: err?.message || 'Failed to apply mutation',
    };
  }
};

export const processBatchMutations = async (mutations: BatchMutation[]): Promise<BatchMutationResult[]> => {
  const results: BatchMutationResult[] = [];
  for (const mutation of mutations) {
    const result = await executeSingleMutation(mutation);
    results.push(result);
  }
  return results;
};
