import api from './api';

export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  createdAt: string;
  updatedAt: string;
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
  const response = await api.get<{ workOrders: WorkOrder[]; total: number }>('/work-orders', {
    params: {
      search: filters?.search && filters.search.trim() ? filters.search.trim() : undefined,
      status: filters?.status && filters.status !== 'ALL' ? filters.status : undefined,
    },
  });
  return response.data.workOrders;
};

export const getWorkOrderById = async (id: string): Promise<WorkOrder> => {
  const response = await api.get<{ workOrder: WorkOrder }>(`/work-orders/${id}`);
  return response.data.workOrder;
};

export const updateWorkOrder = async (id: string, data: Partial<CreateWorkOrderDTO>): Promise<WorkOrder> => {
  const response = await api.put<{ message: string; workOrder: WorkOrder }>(`/work-orders/${id}`, data);
  return response.data.workOrder;
};

export const updateWorkOrderStatus = async (id: string, status: WorkOrderStatus): Promise<WorkOrder> => {
  const response = await api.patch<{ message: string; workOrder: WorkOrder }>(`/work-orders/${id}/status`, {
    status,
  });
  return response.data.workOrder;
};
