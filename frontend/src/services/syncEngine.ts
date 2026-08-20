import api from './api';
import {
  localDb,
  type OutboxMutation,
  type MutationActionType,
  type LocalWorkOrder,
  type FieldNoteItem,
  type ServiceReading,
} from './db';
import type { WorkOrder, WorkOrderNoteItem, WorkOrderReadingItem } from './workOrderService';
import { photoSyncEngine } from './photoSyncEngine';

export class SyncEngine {
  private isSyncing = false;

  public isDeviceOnline(): boolean {
    try {
      const simulated = localStorage.getItem('fsm_simulated_network');
      if (simulated === 'OFFLINE') return false;
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    } catch {
      return true;
    }
  }

  async downloadWorkOrdersForOffline(filters?: { search?: string; status?: string }): Promise<WorkOrder[]> {
    if (!this.isDeviceOnline()) {
      return await this.getCachedWorkOrders(filters);
    }

    try {
      const outboxCount = await localDb.outbox.count();

      if (outboxCount > 0) {
        await this.processOutbox();
      }

      const response = await api.get<{ workOrders: WorkOrder[] }>('/work-orders', {
        params: {
          search: filters?.search && filters.search.trim() ? filters.search.trim() : undefined,
          status: filters?.status,
        },
      });
      const workOrders = response.data.workOrders || [];

      await localDb.transaction('rw', [localDb.workOrders, localDb.syncMeta], async () => {
        for (const wo of workOrders) {
          await localDb.workOrders.put({
            ...wo,
            _syncStatus: 'SYNCED',
            _cachedAt: Date.now(),
          });
        }

        await localDb.syncMeta.put({
          key: 'last_offline_sync',
          value: {
            timestamp: Date.now(),
            count: workOrders.length,
          },
        });
      });

      return workOrders;
    } catch (err: any) {
      return await this.getCachedWorkOrders(filters);
    }
  }

  async getCachedWorkOrders(filters?: { search?: string; status?: string }): Promise<LocalWorkOrder[]> {
    let results = await localDb.workOrders.toArray();

    if (filters?.status) {
      results = results.filter((o) => o.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      results = results.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(term) ||
          o.title?.toLowerCase().includes(term) ||
          o.customer?.name?.toLowerCase().includes(term) ||
          o.asset?.machineName?.toLowerCase().includes(term) ||
          o.technician?.name?.toLowerCase().includes(term),
      );
    }

    results.sort((a, b) => {
      const dateA = a.scheduledDate || a.createdAt || '';
      const dateB = b.scheduledDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    return results;
  }

  async getCachedWorkOrderById(id: string): Promise<LocalWorkOrder | null> {
    return (await localDb.workOrders.get(id)) || null;
  }

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    if (!this.isDeviceOnline()) {
      const cached = await this.getCachedWorkOrderById(id);
      if (cached) return cached;
      throw new Error('Work order not found in offline storage');
    }

    try {
      const outboxCount = await localDb.outbox.count();

      if (outboxCount > 0) {
        await this.processOutbox();
      }

      const response = await api.get<{ workOrder: WorkOrder }>(`/work-orders/${id}`);
      const order = response.data.workOrder;

      await localDb.workOrders.put({
        ...order,
        _syncStatus: 'SYNCED',
        _cachedAt: Date.now(),
      });

      if (order.attachments && order.attachments.length > 0) {
        photoSyncEngine.syncServerAttachments(id, order.attachments).catch(() => {});
      }

      return order;
    } catch (error) {
      const cached = await this.getCachedWorkOrderById(id);
      if (cached) return cached;
      throw error;
    }
  }

  async addNote(
    workOrderId: string,
    content: string,
    user: { id: string | number; name: string },
    type: 'NOTE' | 'SYSTEM' = 'NOTE',
  ): Promise<FieldNoteItem> {
    const noteId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
    const timeFormatted = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newNote: FieldNoteItem = {
      id: noteId,
      workOrderId,
      userId: String(user?.id),
      authorName: user?.name,
      type,
      content: content.trim(),
      timestamp: timeFormatted,
      createdAt: Date.now(),
    };

    const existingWo = await localDb.workOrders.get(workOrderId);
    if (existingWo) {
      const noteItem: WorkOrderNoteItem = {
        id: noteId,
        workOrderId,
        userId: String(user?.id),
        content: newNote.content,
        type,
        user: {
          id: String(user?.id),
          name: user?.name || 'Technician',
          email: '',
          role: 'TECHNICIAN',
        },
        createdAt: new Date().toISOString(),
      };
      existingWo.notes = [noteItem, ...(existingWo.notes || [])];
      await localDb.workOrders.put(existingWo);
    }

    await this.enqueueMutation(workOrderId, 'ADD_NOTE', {
      id: noteId,
      content: newNote.content,
      userId: String(user.id),
      type,
    });

    return newNote;
  }

  async addReading(
    workOrderId: string,
    metric: string,
    value: string,
    unit: string,
    user?: { id?: string | number; name?: string },
  ): Promise<ServiceReading> {
    const readingId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;
    const timeFormatted = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const newReading: ServiceReading = {
      id: readingId,
      workOrderId,
      metric: metric.trim(),
      value: value.trim(),
      unit: unit.trim(),
      timestamp: timeFormatted,
      isLocal: true,
    };

    const existingWo = await localDb.workOrders.get(workOrderId);
    if (existingWo) {
      const readingItem: WorkOrderReadingItem = {
        id: readingId,
        workOrderId,
        userId: user?.id ? String(user.id) : null,
        metric: newReading.metric,
        value: newReading.value,
        unit: newReading.unit,
        recordedAt: new Date().toISOString(),
        technician: {
          id: user?.id ? String(user.id) : '',
          name: user?.name || 'Technician',
          email: '',
        },
        createdAt: new Date().toISOString(),
      };
      existingWo.readings = [readingItem, ...(existingWo.readings || [])];
      await localDb.workOrders.put(existingWo);
    }

    await this.enqueueMutation(workOrderId, 'ADD_READING', {
      id: readingId,
      metric: newReading.metric,
      value: newReading.value,
      unit: newReading.unit,
      userId: user?.id ? String(user.id) : undefined,
      recordedAt: new Date().toISOString(),
    });

    return newReading;
  }

  async enqueueMutation(
    workOrderId: string,
    actionType: MutationActionType,
    payload: Record<string, any>,
    baseVersion?: number,
  ): Promise<OutboxMutation> {
    const existingWo = await localDb.workOrders.get(workOrderId);
    const resolvedVersion = baseVersion !== undefined ? baseVersion : existingWo?.version || 1;
    const resolvedOrderNumber = existingWo?.orderNumber || payload.orderNumber;

    const mutationId = `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mutation: OutboxMutation = {
      mutationId,
      workOrderId,
      orderNumber: resolvedOrderNumber,
      actionType,
      payload,
      baseVersion: resolvedVersion,
      timestamp: Date.now(),
      status: 'PENDING',
      retryCount: 0,
    };

    await localDb.transaction('rw', [localDb.outbox, localDb.workOrders], async () => {
      await localDb.outbox.put(mutation);

      const wo = await localDb.workOrders.get(workOrderId);
      if (wo) {
        if (actionType === 'UPDATE_STATUS') {
          wo.status = payload.status;
          wo._syncStatus = 'PENDING_SYNC';
          if (payload.status === 'COMPLETED') {
            wo.completedAt = new Date().toISOString();
          }
        } else if (actionType === 'COMPLETE_JOB') {
          wo.status = 'COMPLETED';
          wo.completedAt = payload.completedAt || new Date().toISOString();
          wo._syncStatus = 'PENDING_SYNC';
        } else if (actionType === 'UPDATE_CHECKLIST') {
          if (wo.checklistItems) {
            const item = wo.checklistItems.find((c) => c.id === payload.checklistId);
            if (item) {
              item.isCompleted = Boolean(payload.isCompleted);
              item.completedAt = payload.isCompleted ? new Date().toISOString() : null;
            }
          }
        }
        await localDb.workOrders.put(wo);
      }
    });

    if (this.isDeviceOnline()) {
      this.processOutbox().catch(() => {});
    }

    return mutation;
  }

  async processOutbox(): Promise<{ synced: number; conflicts: number; failed: number }> {
    if (this.isSyncing || !this.isDeviceOnline()) {
      return { synced: 0, conflicts: 0, failed: 0 };
    }

    this.isSyncing = true;

    try {
      const pendingMutations = await localDb.outbox.filter((m) => m.status === 'PENDING').toArray();
      pendingMutations.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      if (pendingMutations.length === 0) {
        return { synced: 0, conflicts: 0, failed: 0 };
      }

      for (const m of pendingMutations) {
        m.status = 'SYNCING';
        await localDb.outbox.put(m);
      }

      let responseData: any;
      try {
        const res = await api.post<{ success: boolean; results: any[] }>('/sync/batch', {
          mutations: pendingMutations,
        });
        responseData = res.data;
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.results) {
          responseData = err.response.data;
        } else {
          for (const m of pendingMutations) {
            m.status = 'FAILED';
            m.retryCount += 1;
            m.errorMessage = err?.message || 'Network disconnected';
            await localDb.outbox.put(m);
          }
          return { synced: 0, conflicts: 0, failed: pendingMutations.length };
        }
      }

      let syncedCount = 0;
      let conflictCount = 0;
      let failedCount = 0;

      const serverResults = responseData?.results || [];

      for (const result of serverResults) {
        const mutation = pendingMutations.find((m) => m.mutationId === result.mutationId);
        if (!mutation) continue;

        if (result.status === 'SYNCED') {
          await localDb.outbox.delete(mutation.mutationId);
          syncedCount++;

          const wo = await localDb.workOrders.get(mutation.workOrderId);
          if (wo) {
            wo._syncStatus = 'SYNCED';
            if (result.currentVersion) {
              wo.version = result.currentVersion;
            }
            await localDb.workOrders.put(wo);
          }
        } else if (result.status === 'CONFLICT') {
          mutation.status = 'CONFLICT';
          mutation.errorMessage =
            result.errorMessage || 'Server conflict: Work order was modified by another user while offline';
          await localDb.outbox.put(mutation);
          conflictCount++;
        } else {
          mutation.status = 'FAILED';
          mutation.errorMessage = result.errorMessage || 'Server rejected mutation';
          mutation.retryCount += 1;
          await localDb.outbox.put(mutation);
          failedCount++;
        }
      }

      return { synced: syncedCount, conflicts: conflictCount, failed: failedCount };
    } finally {
      this.isSyncing = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fsm:sync_completed'));
      }
    }
  }

  async getAllMutations(): Promise<OutboxMutation[]> {
    return await localDb.outbox.orderBy('timestamp').reverse().toArray();
  }
  async retryMutation(mutationId: string): Promise<void> {
    const mutation = await localDb.outbox.get(mutationId);
    if (mutation) {
      mutation.status = 'PENDING';
      mutation.errorMessage = undefined;
      await localDb.outbox.put(mutation);
      if (this.isDeviceOnline()) {
        await this.processOutbox();
      }
    }
  }

  async deleteMutation(mutationId: string): Promise<void> {
    await localDb.outbox.delete(mutationId);
  }

  async getOutboxStats(): Promise<{ pending: number; syncing: number; failed: number; total: number }> {
    const mutations = await localDb.outbox.toArray();
    return {
      pending: mutations.filter((m) => m.status === 'PENDING').length,
      syncing: mutations.filter((m) => m.status === 'SYNCING').length,
      failed: mutations.filter((m) => m.status === 'FAILED').length,
      total: mutations.length,
    };
  }

  async getPendingCount(): Promise<number> {
    return await localDb.outbox
      .filter((m) => m.status === 'PENDING' || m.status === 'FAILED' || m.status === 'SYNCING')
      .count();
  }

  async clearSynced(): Promise<void> {
    const synced = await localDb.outbox.where('status').equals('SYNCED').toArray();
    for (const s of synced) {
      await localDb.outbox.delete(s.mutationId);
    }
  }

  async syncAll(): Promise<{
    outbox: { synced: number; conflicts: number; failed: number };
    photos: { uploaded: number; failed: number };
  }> {
    const [outboxResult, photoResult] = await Promise.allSettled([
      this.processOutbox(),
      photoSyncEngine.processPhotoQueue(),
    ]);

    return {
      outbox: outboxResult.status === 'fulfilled' ? outboxResult.value : { synced: 0, conflicts: 0, failed: 0 },
      photos: photoResult.status === 'fulfilled' ? photoResult.value : { uploaded: 0, failed: 0 },
    };
  }
}

export const syncEngine = new SyncEngine();
