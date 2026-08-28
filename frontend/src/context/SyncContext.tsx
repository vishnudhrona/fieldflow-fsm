import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { localDb, type OutboxMutation, type WorkOrderAttachment } from '../services/db';
import { syncEngine } from '../services/syncEngine';
import { photoSyncEngine } from '../services/photoSyncEngine';
import { useNetwork } from './NetworkContext';

export interface SyncContextType {
  pendingCount: number;
  photoPendingCount: number;
  retryCount: number;
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

  const mutations = useLiveQuery(() => localDb.outbox.orderBy('timestamp').reverse().toArray(), [], []) ?? [];

  const pendingAttachments =
    useLiveQuery(
      () => localDb.attachments.where('status').anyOf(['PENDING', 'UPLOADING', 'FAILED']).toArray(),
      [],
      [],
    ) ?? [];

  const activePendingMutations = mutations.filter((m) => m.status === 'PENDING' || m.status === 'RETRY');
  const activePendingPhotos = pendingAttachments.filter((a) => a.status === 'PENDING' || a.status === 'UPLOADING' || a.status === 'FAILED');

  const pendingCount = mutations.filter((m) => m.status === 'PENDING').length;
  const retryCount = mutations.filter((m) => m.status === 'RETRY').length;
  const conflictCount = mutations.filter((m) => m.status === 'CONFLICT').length;
  const photoPendingCount = activePendingPhotos.length;

  const totalPending = activePendingMutations.length + photoPendingCount;
  const hasWorkToSync = activePendingMutations.length > 0 || photoPendingCount > 0;

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

  // Periodic exponential/bounded backoff retry while continuously online
  useEffect(() => {
    if (!isOnline || isSyncing) return;

    const hasRetryItems = retryCount > 0 || activePendingPhotos.some((a) => a.status === 'FAILED');
    if (!hasRetryItems) return;

    const maxRetries = Math.max(
      ...activePendingMutations.map((m) => m.retryCount || 0),
      ...activePendingPhotos.map((a) => a.retryCount || 0),
      1,
    );
    const delayMs = Math.min(30000, Math.max(5000, maxRetries * 5000));

    const timerId = setTimeout(() => {
      syncNow();
    }, delayMs);

    return () => clearTimeout(timerId);
  }, [isOnline, isSyncing, retryCount, activePendingMutations, activePendingPhotos, syncNow]);

  return (
    <SyncContext.Provider
      value={{
        pendingCount,
        photoPendingCount,
        retryCount,
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
