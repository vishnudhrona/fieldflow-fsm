import Dexie, { type Table } from 'dexie';
import type { WorkOrder } from './workOrderService';

export type MutationActionType = 'UPDATE_STATUS' | 'COMPLETE_JOB' | 'UPDATE_CHECKLIST' | 'ADD_NOTE' | 'ADD_READING' | 'DELETE_ATTACHMENT';

export type OutboxStatus = 'PENDING' | 'RETRY' | 'CONFLICT' | 'SYNCED';

export interface OutboxMutation {
  mutationId: string;
  workOrderId: string;
  orderNumber?: string;
  actionType: MutationActionType;
  payload: Record<string, any>;
  baseVersion?: number;
  timestamp: number;
  status: OutboxStatus;
  retryCount: number;
  errorMessage?: string;
}

export interface LocalWorkOrder extends WorkOrder {
  _syncStatus?: 'SYNCED' | 'PENDING_SYNC' | 'CONFLICT';
  _cachedAt?: number;
}

export interface ServiceReading {
  id: string;
  workOrderId: string;
  metric: string;
  value: string;
  unit: string;
  timestamp: string;
  isLocal: boolean;
}

export type AttachmentSyncStatus = 'PENDING' | 'UPLOADING' | 'SYNCED' | 'FAILED';

export interface WorkOrderAttachment {
  id: string;
  workOrderId: string;
  orderNumber?: string;
  technicianId?: string | null;
  technicianName?: string | null;
  serverAttachmentId?: string;
  url?: string;
  previewUrl?: string;
  blob?: Blob | File;
  name: string;
  size?: number;
  mimeType?: string;
  status: AttachmentSyncStatus;
  errorMessage?: string;
  retryCount: number;
  timestamp: string;
  createdAt: number;
}


export interface AuditTrailItem {
  id: string;
  workOrderId: string;
  time: string;
  title: string;
  description: string;
  timestamp: number;
}

export const getTechnicianDbName = (technicianId?: string | number): string => {
  if (technicianId) {
    return `fieldflow_fsm_db_${technicianId}`;
  }
  try {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.id) {
        return `fieldflow_fsm_db_${user.id}`;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return 'fieldflow_fsm_db_default';
};

export class FieldFlowDatabase extends Dexie {
  workOrders!: Table<LocalWorkOrder, string>;
  attachments!: Table<WorkOrderAttachment, string>;
  outbox!: Table<OutboxMutation, string>;
  syncMeta!: Table<{ key: string; value: any }, string>;

  constructor(dbName = 'fieldflow_fsm_db_default') {
    super(dbName);
    this.version(4).stores({
      workOrders: 'id, orderNumber, status, scheduledDate, _syncStatus',
      attachments: 'id, workOrderId, status, createdAt, timestamp',
      outbox: 'mutationId, workOrderId, actionType, status, timestamp',
      syncMeta: 'key',
    });
    this.version(5).stores({
      workOrders: 'id, orderNumber, status, scheduledDate, _syncStatus',
      attachments: 'id, workOrderId, status, serverAttachmentId, createdAt, timestamp',
      outbox: 'mutationId, workOrderId, actionType, status, timestamp',
      syncMeta: 'key',
    });
  }
}

const dbInstances = new Map<string, FieldFlowDatabase>();

export const getTechnicianDb = (technicianId?: string | number): FieldFlowDatabase => {
  const dbName = getTechnicianDbName(technicianId);
  if (!dbInstances.has(dbName)) {
    dbInstances.set(dbName, new FieldFlowDatabase(dbName));
  }
  return dbInstances.get(dbName)!;
};

export const checkAndCleanupDbOnLogout = async (): Promise<void> => {
  try {
    const activeDb = getTechnicianDb();
    const outboxCount = await activeDb.outbox.count();
    const pendingAttachmentsCount = await activeDb.attachments
      .filter((a) => a.status !== 'SYNCED')
      .count();

    if (outboxCount === 0 && pendingAttachmentsCount === 0) {
      const dbName = activeDb.name;
      activeDb.close();
      await Dexie.delete(dbName);
      dbInstances.delete(dbName);
    }
  } catch {
    // Leave database intact if check encounters an error
  }
};

export const localDb = new Proxy({} as FieldFlowDatabase, {
  get(_target, prop: string | symbol) {
    const activeDb = getTechnicianDb();
    const value = Reflect.get(activeDb, prop, activeDb);
    return typeof value === 'function' ? value.bind(activeDb) : value;
  },
});

export const db = localDb;



