import crypto from 'crypto';
import { Transaction } from 'sequelize';
import { SyncOperation } from '../models';
import type { SyncOperationState } from '../models/syncOperation';

export const stableHash = (value: unknown): string => {
  const normalized = JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (val as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return val;
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

const STALE_PROCESSING_MS = 5 * 60 * 1000;

export type ClaimResult =
  | { type: 'NEW'; operationId: string }
  | { type: 'REPLAY'; responsePayload: Record<string, any> | null }
  | { type: 'IN_PROGRESS' }
  | { type: 'HASH_MISMATCH' };

export const claimSyncOperation = async (input: {
  actorId: string;
  mutationId: string;
  workOrderId?: string | null;
  operationType: string;
  requestHash: string;
}): Promise<ClaimResult> => {
  const { actorId, mutationId, workOrderId, operationType, requestHash } = input;

  try {
    const created = await SyncOperation.create({
      actorId,
      mutationId,
      workOrderId: workOrderId || null,
      operationType,
      requestHash,
      state: 'PROCESSING',
    });
    return { type: 'NEW', operationId: created.id };
  } catch (err: any) {
    if (err?.name !== 'SequelizeUniqueConstraintError') throw err;

    const existing = await SyncOperation.findOne({ where: { actorId, mutationId } });
    if (!existing) return { type: 'IN_PROGRESS' };

    if (existing.requestHash !== requestHash) {
      return { type: 'HASH_MISMATCH' };
    }

    if (existing.state === 'SUCCEEDED') {
      return { type: 'REPLAY', responsePayload: existing.responsePayload };
    }

    if (existing.state === 'PROCESSING') {
      const age = Date.now() - new Date(existing.createdAt).getTime();
      if (age > STALE_PROCESSING_MS) {
        await existing.destroy();
        const reclaimed = await SyncOperation.create({
          actorId,
          mutationId,
          workOrderId: workOrderId || null,
          operationType,
          requestHash,
          state: 'PROCESSING',
        });
        return { type: 'NEW', operationId: reclaimed.id };
      }
      return { type: 'IN_PROGRESS' };
    }

    return { type: 'REPLAY', responsePayload: existing.responsePayload };
  }
};

export const completeSyncOperation = async (
  operationId: string,
  state: SyncOperationState,
  responsePayload: Record<string, any> | null,
  transaction?: Transaction,
): Promise<void> => {
  await SyncOperation.update(
    { state, responsePayload, completedAt: new Date() },
    { where: { id: operationId }, transaction },
  );
};

export const releaseSyncOperation = async (operationId: string): Promise<void> => {
  await SyncOperation.destroy({ where: { id: operationId } });
};
