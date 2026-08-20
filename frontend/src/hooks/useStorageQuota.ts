import { useState, useEffect, useCallback } from 'react';

export interface StorageQuotaInfo {
  usage: number; // in bytes
  quota: number; // in bytes
  percentUsed: number;
  usageFormatted: string;
  quotaFormatted: string;
  isPersisted: boolean;
  requestPersistence: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function useStorageQuota(): StorageQuotaInfo {
  const [usage, setUsage] = useState<number>(0);
  const [quota, setQuota] = useState<number>(0);
  const [percentUsed, setPercentUsed] = useState<number>(0);
  const [isPersisted, setIsPersisted] = useState<boolean>(false);

  const checkStorage = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      try {
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          console.log(34, estimate);
          
          const u = estimate.usage || 0;
          const q = estimate.quota || 0;
          setUsage(u);
          setQuota(q);
          setPercentUsed(q > 0 ? (u / q) * 100 : 0);
        }

        if (navigator.storage.persisted) {
          const persisted = await navigator.storage.persisted();
          setIsPersisted(persisted);
        }
      } catch (err) {
        console.warn('Storage API estimate failed:', err);
      }
    }
  }, []);

  const requestPersistence = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.persist) {
      try {
        const persisted = await navigator.storage.persist();
        setIsPersisted(persisted);
        return persisted;
      } catch (err) {
        console.error('Persistence request failed:', err);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  return {
    usage,  
    quota,
    percentUsed,
    usageFormatted: formatBytes(usage),
    quotaFormatted: formatBytes(quota),
    isPersisted,
    requestPersistence,
    refresh: checkStorage,
  };
}
