import api from './api';
import { localDb, type OutboxMutation, type MutationActionType, type LocalWorkOrder } from './db';
import type { WorkOrder, WorkOrderReadingItem, WorkOrderNoteItem } from './workOrderService';
import { isDeviceOnline } from '../utils';

export class SyncEngine {
  private isSyncing = false;

  public isDeviceOnline(): boolean {
    return isDeviceOnline();
  }

  async enqueueMutation(
    workOrderId: string,
    actionType: MutationActionType,
    payload: Record<string, any>,
    baseVersion?: number
  ): Promise<OutboxMutation> {
    const existingWo = await localDb.workOrders.get(workOrderId);
    const resolvedVersion = baseVersion !== undefined ? baseVersion : existingWo?.version || 1;
    const resolvedOrderNumber = existingWo?.orderNumber || payload.orderNumber;

    const mutationId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

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

    let resultMutation: OutboxMutation = mutation;

    await localDb.transaction('rw', [localDb.outbox, localDb.workOrders], async () => {
      if (actionType === 'UPDATE_CHECKLIST' && payload.checklistId) {
        const existing = await localDb.outbox
          .where('workOrderId')
          .equals(workOrderId)
          .filter(
            (m) =>
              m.actionType === 'UPDATE_CHECKLIST' &&
              m.payload?.checklistId === payload.checklistId &&
              (m.status === 'PENDING' || m.status === 'RETRY')
          )
          .first();

        if (existing) {
          existing.payload = { ...existing.payload, ...payload };
          existing.timestamp = Date.now();
          existing.status = 'PENDING';
          await localDb.outbox.put(existing);
          resultMutation = existing;
        } else {
          await localDb.outbox.put(mutation);
        }
      } else {
        await localDb.outbox.put(mutation);
      }

      const wo = await localDb.workOrders.get(workOrderId);
      if (wo) {
        if (actionType === 'UPDATE_STATUS' || actionType === 'COMPLETE_JOB') {
          wo.status = payload.status;
          wo._syncStatus = 'PENDING_SYNC';
          wo.version = (wo.version || 1) + 1;
          if (payload.status === 'COMPLETED') {
            wo.completedAt = payload.completedAt || new Date().toISOString();
          }
        } else if (actionType === 'UPDATE_CHECKLIST' && payload.checklistId) {
          if (wo.checklistItems) {
            wo.checklistItems = wo.checklistItems.map((item) =>
              item.id === payload.checklistId
                ? {
                    ...item,
                    isCompleted: Boolean(payload.isCompleted),
                    completedAt: payload.isCompleted ? (payload.completedAt || new Date().toISOString()) : null,
                  }
                : item
            );
          }
          wo._syncStatus = 'PENDING_SYNC';
        } else if (actionType === 'ADD_READING') {
          const newReading: WorkOrderReadingItem = {
            id: payload.id || `read-${Date.now()}`,
            workOrderId,
            userId: payload.userId || null,
            technician: payload.technician || null,
            metric: payload.metric,
            value: payload.value,
            unit: payload.unit,
            recordedAt: payload.recordedAt || new Date().toISOString(),
            createdAt: payload.recordedAt || new Date().toISOString(),
          };
          wo.readings = [newReading, ...(wo.readings || [])];
          wo._syncStatus = 'PENDING_SYNC';
        } else if (actionType === 'ADD_NOTE') {
          const newNote: WorkOrderNoteItem = {
            id: payload.id || `note-${Date.now()}`,
            workOrderId,
            userId: payload.userId || null,
            content: payload.content,
            type: payload.type || 'NOTE',
            user: payload.user || null,
            createdAt: payload.createdAt || new Date().toISOString(),
          };
          wo.notes = [newNote, ...(wo.notes || [])];
          wo._syncStatus = 'PENDING_SYNC';
        } else if (actionType === 'DELETE_ATTACHMENT' && (payload.attachmentId || payload.id)) {
          const targetId = payload.attachmentId || payload.id;
          if (wo.attachments) {
            wo.attachments = wo.attachments.filter(
              (a: any) => a.id !== targetId && a.serverAttachmentId !== targetId
            );
          }
          wo._syncStatus = 'PENDING_SYNC';
        }
        await localDb.workOrders.put(wo);
      }
    });

    if (this.isDeviceOnline()) {
      this.processOutbox().catch(() => {});
    }

    return resultMutation;
  }


  async processOutbox(): Promise<{ synced: number; conflicts: number; retried: number }> {
    if (this.isSyncing || !this.isDeviceOnline()) {
      return { synced: 0, conflicts: 0, retried: 0 };
    }

    this.isSyncing = true;

    try {
      const pendingMutations = await localDb.outbox
        .filter((m) => m.status === 'PENDING' || m.status === 'RETRY')
        .toArray();
      pendingMutations.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      if (pendingMutations.length === 0) {
        return { synced: 0, conflicts: 0, retried: 0 };
      }

      let responseData: { success?: boolean; message?: string; results?: any[] } | undefined;
      try {
        const idempotencyKey =
          pendingMutations.length === 1
            ? pendingMutations[0].mutationId
            : typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `batch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const res = await api.post<{ success: boolean; results: any[] }>(
          '/sync/batch',
          {
            mutations: pendingMutations,
          },
          {
            headers: {
              'X-Idempotency-Key': idempotencyKey,
            },
          },
        );
        responseData = res.data;
      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.results) {
          responseData = err.response.data;
        } else {
          for (const m of pendingMutations) {
            m.status = 'RETRY';
            m.retryCount = (m.retryCount || 0) + 1;
            m.errorMessage = err?.message || 'Network error';
            await localDb.outbox.put(m);
          }
          return { synced: 0, conflicts: 0, retried: pendingMutations.length };
        }
      }

      if (!responseData || responseData.success !== true || !Array.isArray(responseData.results)) {
        for (const m of pendingMutations) {
          m.status = 'RETRY';
          m.retryCount = (m.retryCount || 0) + 1;
          m.errorMessage = responseData?.message || 'Sync failed: unexpected server response';
          await localDb.outbox.put(m);
        }
        return { synced: 0, conflicts: 0, retried: pendingMutations.length };
      }

      const serverResults = responseData.results;
      let syncedCount = 0;
      let conflictCount = 0;
      let retriedCount = 0;

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
            result.errorMessage || 'Server conflict: Work order was modified by another user';
          await localDb.outbox.put(mutation);
          conflictCount++;

          const wo = await localDb.workOrders.get(mutation.workOrderId);
          if (wo) {
            const updatedWo = result.serverData
              ? { ...wo, ...result.serverData, _syncStatus: 'CONFLICT' as const, _cachedAt: Date.now() }
              : { ...wo, _syncStatus: 'CONFLICT' as const };
            await localDb.workOrders.put(updatedWo);
          }
        } else {
          mutation.status = 'RETRY';
          mutation.errorMessage = result.errorMessage || 'Synchronization failed';
          mutation.retryCount = (mutation.retryCount || 0) + 1;
          await localDb.outbox.put(mutation);
          retriedCount++;
        }
      }

      for (const m of pendingMutations) {
        if (!serverResults.some((r) => r.mutationId === m.mutationId)) {
          m.status = 'RETRY';
          m.retryCount = (m.retryCount || 0) + 1;
          m.errorMessage = 'No result returned from server for this mutation';
          await localDb.outbox.put(m);
          retriedCount++;
        }
      }

      return { synced: syncedCount, conflicts: conflictCount, retried: retriedCount };
    } catch (error) {
      console.error('Error processing outbox:', error);
      return { synced: 0, conflicts: 0, retried: 0 };
    } finally {
      this.isSyncing = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fsm:sync_completed'));
      }
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
          o.technician?.name?.toLowerCase().includes(term)
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
      const response = await api.get<{ workOrder: WorkOrder }>(`/work-orders/${id}`);
      const order = response.data.workOrder;

      const existing = await localDb.workOrders.get(id);
      if (existing && (existing._syncStatus === 'PENDING_SYNC' || existing._syncStatus === 'CONFLICT')) {
        const merged: LocalWorkOrder = {
          ...order,
          ...existing,
          title: order.title,
          customer: order.customer || existing.customer,
          asset: order.asset || existing.asset,
          technician: order.technician || existing.technician,
          notes: existing.notes && existing.notes.length > 0 ? existing.notes : order.notes,
          readings: existing.readings && existing.readings.length > 0 ? existing.readings : order.readings,
          checklistItems: existing.checklistItems && existing.checklistItems.length > 0 ? existing.checklistItems : order.checklistItems,
          attachments: existing.attachments && existing.attachments.length > 0 ? existing.attachments : order.attachments,
          _syncStatus: existing._syncStatus,
          _cachedAt: Date.now(),
        };
        await localDb.workOrders.put(merged);
        return merged;
      }

      await localDb.workOrders.put({
        ...order,
        _syncStatus: 'SYNCED',
        _cachedAt: Date.now(),
      });

      return order;
    } catch (error) {
      const cached = await this.getCachedWorkOrderById(id);
      if (cached) return cached;
      throw error;
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
          const existing = await localDb.workOrders.get(wo.id);
          if (existing && (existing._syncStatus === 'PENDING_SYNC' || existing._syncStatus === 'CONFLICT')) {
            await localDb.workOrders.put({
              ...wo,
              ...existing,
              title: wo.title,
              customer: wo.customer || existing.customer,
              asset: wo.asset || existing.asset,
              technician: wo.technician || existing.technician,
              scheduledDate: wo.scheduledDate || existing.scheduledDate,
              notes: existing.notes && existing.notes.length > 0 ? existing.notes : wo.notes,
              readings: existing.readings && existing.readings.length > 0 ? existing.readings : wo.readings,
              checklistItems: existing.checklistItems && existing.checklistItems.length > 0 ? existing.checklistItems : wo.checklistItems,
              attachments: existing.attachments && existing.attachments.length > 0 ? existing.attachments : wo.attachments,
              _syncStatus: existing._syncStatus,
              _cachedAt: Date.now(),
            });
          } else {
            await localDb.workOrders.put({
              ...wo,
              _syncStatus: 'SYNCED',
              _cachedAt: Date.now(),
            });
          }
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
    } catch {
      return await this.getCachedWorkOrders(filters);
    }
  }

  async retryMutation(mutationId: string): Promise<void> {
    const mutation = await localDb.outbox.get(mutationId);
    if (mutation) {
      const wo = await localDb.workOrders.get(mutation.workOrderId);
      if (wo && wo.version !== undefined) {
        mutation.baseVersion = wo.version;
      }

      if (mutation.status === 'CONFLICT') {
        await localDb.outbox.delete(mutationId);
        mutation.mutationId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }

      mutation.status = 'PENDING';
      mutation.errorMessage = undefined;
      mutation.timestamp = Date.now();
      await localDb.outbox.put(mutation);
      if (this.isDeviceOnline()) {
        await this.processOutbox();
      }
    }
  }

  async deleteMutation(mutationId: string): Promise<void> {
    await localDb.outbox.delete(mutationId);
  }
}

export const syncEngine = new SyncEngine();
