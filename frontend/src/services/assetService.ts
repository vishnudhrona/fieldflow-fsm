import api from './api';

export interface Asset {
  id: string;
  customerId?: string | null;
  machineName: string;
  machineType: string;
  modelName: string;
  serialNumber?: string | null;
  installationDate: string;
  notes?: string | null;
  status: boolean;
  imageUrl?: string | null;
  secondaryImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssetPayload {
  customerId?: string | null;
  machineName: string;
  machineType: string;
  modelName: string;
  serialNumber?: string;
  installationDate: string;
  notes?: string;
  status: boolean;
  imageUrl?: string;
  secondaryImageUrl?: string;
}

export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  const response = await api.post<{ success: boolean; data: Asset }>('/assets', payload);
  return response.data.data;
}

export async function getAssetById(id: string): Promise<Asset> {
  const response = await api.get<{ success: boolean; data: Asset }>(`/assets/${id}`);
  return response.data.data;
}

export async function updateAsset(id: string, payload: Partial<CreateAssetPayload>): Promise<Asset> {
  const response = await api.put<{ success: boolean; data: Asset }>(`/assets/${id}`, payload);
  return response.data.data;
}

export async function deleteAsset(id: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/assets/${id}`);
  return response.data;
}

export default {
  createAsset,
  getAssetById,
  updateAsset,
  deleteAsset,
};
