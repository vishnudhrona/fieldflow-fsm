import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDb, type OutboxMutation, type WorkOrderAttachment } from '../services/db';
import { syncEngine } from '../services/syncEngine';
import { photoSyncEngine } from '../services/photoSyncEngine';
import { useNetwork } from './NetworkContext';

export interface SyncContextType {
  pendingCount: number;
  photoPendingCount: number;
  conflictCount: number;
  totalPending: number;
  isSyncing: boolean;

  mutations: OutboxMutation[];
  pendingAttachments: WorkOrderAttachment[];

  syncNow: () => Promise<void>;
  retryMutation: (id: string) => Promise<void>;
  deleteMutation: (id: string) => Promise<void>;
  queuePhoto: (workOrderId: string, file: File) => Promise<WorkOrderAttachment>;
  retryPhoto: (id: string) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isOnline } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const mutations =
    useLiveQuery(
      () => localDb.outbox.orderBy('timestamp').reverse().toArray(),
      [],
      []
    ) ?? [];

  const pendingAttachments =
    useLiveQuery(
      () => localDb.attachments.where('status').anyOf(['PENDING', 'UPLOADING', 'FAILED']).toArray(),
      [],
      []
    ) ?? [];

  const activePendingMutations = mutations.filter((m) => m.status === 'PENDING');
  const activePendingPhotos = pendingAttachments.filter((a) => a.status === 'PENDING');

  const pendingCount = activePendingMutations.length;
  const conflictCount = mutations.filter((m) => m.status === 'CONFLICT').length;
  const failedCount = mutations.filter((m) => m.status === 'FAILED').length;
  const photoPendingCount = activePendingPhotos.length;

  const totalPending = pendingCount + photoPendingCount + conflictCount + failedCount;
  const hasWorkToSync = pendingCount > 0 || photoPendingCount > 0;

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      await syncEngine.processOutbox();
      await photoSyncEngine.processPhotoQueue();
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline]);

  const retryMutation = useCallback(async (id: string) => {
    await syncEngine.retryMutation(id);
  }, []);

  const deleteMutation = useCallback(async (id: string) => {
    await syncEngine.deleteMutation(id);
  }, []);

  const queuePhoto = useCallback(async (workOrderId: string, file: File): Promise<WorkOrderAttachment> => {
    return await photoSyncEngine.queuePhotoAttachment(workOrderId, file);
  }, []);

  const retryPhoto = useCallback(async (id: string) => {
    await photoSyncEngine.retryPhoto(id);
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    await photoSyncEngine.deletePhoto(id);
  }, []);

  useEffect(() => {
    if (isOnline && hasWorkToSync) {
      syncNow();
    }
  }, [isOnline, hasWorkToSync, syncNow]);

  return (
    <SyncContext.Provider
      value={{
        pendingCount,
        photoPendingCount,
        conflictCount,
        totalPending,
        isSyncing,
        mutations,
        pendingAttachments,
        syncNow,
        retryMutation,
        deleteMutation,
        queuePhoto,
        retryPhoto,
        deletePhoto,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within a SyncProvider');
  return context;
}

export default SyncContext;

