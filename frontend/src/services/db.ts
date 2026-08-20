import Dexie, { type Table } from 'dexie';
import type { WorkOrder } from './workOrderService';

export type MutationActionType = 'UPDATE_STATUS' | 'COMPLETE_JOB' | 'UPDATE_CHECKLIST' | 'ADD_NOTE' | 'ADD_READING';

export interface OutboxMutation {
  mutationId: string;
  workOrderId: string;
  orderNumber?: string;
  actionType: MutationActionType;
  payload: Record<string, any>;
  baseVersion?: number;
  timestamp: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  retryCount: number;
  errorMessage?: string;
}

export interface LocalWorkOrder extends WorkOrder {
  _syncStatus?: 'SYNCED' | 'PENDING_SYNC';
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

export interface FieldNoteItem {
  id: string;
  workOrderId: string;
  userId: string;
  authorName: string;
  type: 'NOTE' | 'SYSTEM';
  content: string;
  timestamp: string;
  createdAt?: number;
}

export interface AuditTrailItem {
  id: string;
  workOrderId: string;
  time: string;
  title: string;
  description: string;
  timestamp: number;
}

export class FieldFlowDatabase extends Dexie {
  workOrders!: Table<LocalWorkOrder, string>;
  attachments!: Table<WorkOrderAttachment, string>;
  outbox!: Table<OutboxMutation, string>;
  syncMeta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('fieldflow_fsm_db');
    this.version(4).stores({
      workOrders: 'id, orderNumber, status, scheduledDate, _syncStatus',
      attachments: 'id, workOrderId, status, createdAt, timestamp',
      outbox: 'mutationId, workOrderId, actionType, status, timestamp',
      syncMeta: 'key',
    });
  }
}

export const localDb = new FieldFlowDatabase();
export const db = localDb;
