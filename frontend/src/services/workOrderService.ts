import api from './api';
import { syncEngine } from './syncEngine';

export type WorkOrderStatus = 'NEW' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface WorkOrderChecklistItem {
  id: string;
  workOrderId: string;
  taskDescription: string;
  isCompleted: boolean;
  orderIndex: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  title: string;
  description?: string | null;
  customerId: string;
  assetId: string;
  technicianId?: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledDate: string;
  scheduledTime?: string | null;
  completedAt?: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
    address: string;
    contactPerson?: string | null;
  };
  asset?: {
    id: string;
    machineName: string;
    machineType: string;
    modelName: string;
    imageUrl?: string | null;
  };
  technician?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  } | null;
  checklistItems?: WorkOrderChecklistItem[];
  notes?: WorkOrderNoteItem[];
  history?: WorkOrderHistoryItem[];
  readings?: WorkOrderReadingItem[];
  attachments?: WorkOrderAttachmentItem[];
  version?: number;
  _syncStatus?: 'SYNCED' | 'PENDING_SYNC' | 'CONFLICT';
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderAttachmentItem {
  id: string;
  workOrderId: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  technicianId?: string | null;
  technician?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderReadingItem {
  id: string;
  workOrderId: string;
  userId?: string | null;
  metric: string;
  value: string;
  unit: string;
  recordedAt: string;
  technician?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkOrderHistoryItem {
  id: string;
  workOrderId: string;
  userId?: string | null;
  action: string;
  description: string;
  metadata?: Record<string, any> | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface WorkOrderNoteItem {
  id: string;
  workOrderId: string;
  userId?: string | null;
  content: string;
  type: 'NOTE' | 'SYSTEM';
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN_DISPATCHER' | 'TECHNICIAN';
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateWorkOrderDTO {
  title: string;
  description?: string;
  customerId: string;
  assetId: string;
  technicianId?: string | null;
  priority: WorkOrderPriority;
  scheduledDate: string;
  scheduledTime?: string;
  checklistItems?: string[];
}

export const createWorkOrder = async (data: CreateWorkOrderDTO): Promise<WorkOrder> => {
  const response = await api.post<{ message: string; workOrder: WorkOrder }>('/work-orders', data);
  return response.data.workOrder;
};

export const getWorkOrders = async (filters?: { search?: string; status?: string }): Promise<WorkOrder[]> => {
  return await syncEngine.downloadWorkOrdersForOffline(filters);
};

export const getWorkOrderById = async (id: string): Promise<WorkOrder> => {
  return await syncEngine.getWorkOrderById(id);
};

export const updateWorkOrder = async (id: string, data: Partial<CreateWorkOrderDTO>): Promise<WorkOrder> => {
  const response = await api.put<{ message: string; workOrder: WorkOrder }>(`/work-orders/${id}`, data);
  return response.data.workOrder;
};

export const updateWorkOrderStatus = async (id: string, status: WorkOrderStatus): Promise<void> => {
  await syncEngine.enqueueMutation(id, 'UPDATE_STATUS', { status });
};

export const toggleChecklistItem = async (
  workOrderId: string,
  checklistId: string,
  isCompleted: boolean,
): Promise<void> => {
  await syncEngine.enqueueMutation(workOrderId, 'UPDATE_CHECKLIST', {
    checklistId,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : null,
  });
};

export const addWorkOrderNote = async (
  workOrderId: string,
  content: string,
  user?: { id?: string | number; name?: string; email?: string; role?: 'ADMIN_DISPATCHER' | 'TECHNICIAN' },
  type: 'NOTE' | 'SYSTEM' = 'NOTE',
): Promise<WorkOrderNoteItem> => {
  const noteId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = new Date().toISOString();

  const noteItem: WorkOrderNoteItem = {
    id: noteId,
    workOrderId,
    userId: user?.id ? String(user.id) : null,
    content,
    type,
    user: user?.id
      ? {
          id: String(user.id),
          name: user.name || 'User',
          email: user.email || '',
          role: user.role || 'TECHNICIAN',
        }
      : null,
    createdAt,
  };

  await syncEngine.enqueueMutation(workOrderId, 'ADD_NOTE', {
    id: noteId,
    content,
    type,
    createdAt,
    userId: user?.id ? String(user.id) : null,
    user: noteItem.user,
  });

  return noteItem;
};

export const addWorkOrderReading = async (
  workOrderId: string,
  metric: string,
  value: string,
  unit: string,
  user?: { id?: string | number; name?: string },
): Promise<WorkOrderReadingItem> => {
  const readingId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `read-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const recordedAt = new Date().toISOString();

  const readingItem: WorkOrderReadingItem = {
    id: readingId,
    workOrderId,
    userId: user?.id ? String(user.id) : null,
    metric,
    value,
    unit,
    recordedAt,
    technician: user?.id
      ? {
          id: String(user.id),
          name: user.name || 'Technician',
          email: '',
        }
      : null,
    createdAt: recordedAt,
  };

  await syncEngine.enqueueMutation(workOrderId, 'ADD_READING', {
    id: readingId,
    metric,
    value,
    unit,
    recordedAt,
    userId: user?.id ? String(user.id) : null,
    technician: user?.id
      ? {
          id: String(user.id),
          name: user.name,
          email: '',
        }
      : null,
  });

  return readingItem;
};
