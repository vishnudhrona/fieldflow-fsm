import api from './api';
import type { Asset } from './assetService';

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  countryCode?: string;
  email: string;
  address: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | boolean;
  assetsCount?: number;
  activeOrders?: number;
}

export interface CreateCustomerDTO {
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  status: boolean;
}

export interface CustomerResponse {
  id: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email: string;
  address: string;
  notes?: string | null;
  status: boolean;
  assets?: Asset[];
  createdAt: string;
  updatedAt: string;
}

export const createCustomer = async (data: CreateCustomerDTO): Promise<CustomerResponse> => {
  const response = await api.post<{ message: string; customer: CustomerResponse }>('/customers', data);
  return response.data.customer;
};

export const getCustomers = async (search?: string): Promise<CustomerResponse[]> => {
  const response = await api.get<{ customers: CustomerResponse[]; total: number }>('/customers', {
    params: search && search.trim() ? { search: search.trim() } : undefined,
  });
  return response.data.customers;
};

export const getCustomerById = async (id: string): Promise<CustomerResponse> => {
  const response = await api.get<{ customer: CustomerResponse }>(`/customers/${id}`);
  return response.data.customer;
};

export const updateCustomer = async (
  id: string,
  data: Partial<CreateCustomerDTO>
): Promise<CustomerResponse> => {
  const response = await api.patch<{ message: string; customer: CustomerResponse }>(`/customers/${id}`, data);
  return response.data.customer;
};
