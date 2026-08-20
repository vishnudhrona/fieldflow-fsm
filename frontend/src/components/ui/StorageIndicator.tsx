import type { FC } from 'react';
import { Database, HardDrive, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useStorageQuota } from '../../hooks';

export interface StorageIndicatorProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'detailed';
  customLabel?: string;
}

export const StorageIndicator: FC<StorageIndicatorProps> = ({
  className = '',
  variant = 'navbar',
  customLabel,
}) => {
  const storage = useStorageQuota();

  const roundedPercent = Math.min(100, Math.max(0, Math.round(storage.percentUsed || 0)));
  const freeBytes = Math.max(0, storage.quota - storage.usage);

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const freeFormatted = formatBytes(freeBytes);

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return { text: 'text-rose-600', bg: 'bg-rose-500', lightBg: 'bg-rose-50', border: 'border-rose-200' };
    if (percent >= 75) return { text: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', border: 'border-emerald-200' };
  };

  const statusColor = getStatusColor(roundedPercent);

  const displayText =
    customLabel ||
    (storage.quota > 0
      ? `${roundedPercent}% of ${storage.quotaFormatted}`
      : `${storage.usageFormatted || '0 MB'} used`);

  if (variant === 'detailed') {
    return (
      <div className={`p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 ${className}`}>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700'>
              <HardDrive className='w-4 h-4' />
            </div>
            <div>
              <h4 className='text-xs font-bold text-slate-900'>Offline Storage Quota</h4>
              <p className='text-[11px] text-slate-500'>{storage.usageFormatted} of {storage.quotaFormatted} used</p>
            </div>
          </div>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${statusColor.lightBg} ${statusColor.text} ${statusColor.border}`}>
            {roundedPercent}%
          </span>
        </div>

        <div className='w-full bg-slate-100 h-2 rounded-full overflow-hidden'>
          <div
            className={`h-full ${statusColor.bg} transition-all duration-500 rounded-full`}
            style={{ width: `${Math.max(roundedPercent, 2)}%` }}
          />
        </div>

        <div className='flex items-center justify-between text-[11px] text-slate-500 pt-1'>
          <span>Free: <strong className='text-slate-700'>{freeFormatted}</strong></span>
          <span className='flex items-center gap-1'>
            {storage.isPersisted ? (
              <span className='text-emerald-600 flex items-center gap-1 font-medium'>
                <ShieldCheck className='w-3.5 h-3.5' /> Persisted
              </span>
            ) : (
              <span className='text-amber-600 flex items-center gap-1 font-medium'>
                <ShieldAlert className='w-3.5 h-3.5' /> Standard
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      title={`Offline Storage: ${storage.usageFormatted || '0 MB'} used (${roundedPercent}% of ${storage.quotaFormatted || 'Quota'})`}
      className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs select-none ${className}`}
    >
      <Database className='w-3.5 h-3.5 text-slate-500 shrink-0' />
      <span className='hidden sm:inline'>{displayText}</span>
      <span className='inline sm:hidden font-mono'>{roundedPercent}%</span>

      <span className={`w-1.5 h-1.5 rounded-full ${statusColor.bg} shrink-0`} />
    </div>
  );
};

export default StorageIndicator;
