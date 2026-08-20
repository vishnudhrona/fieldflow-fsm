import type { FC } from 'react';
import { Activity, RefreshCw, AlertCircle, CloudOff } from 'lucide-react';
import { Button, Input } from '../ui';
import type { WorkOrderReadingItem } from '../../services/workOrderService';
import type { ServiceReading } from '../../services/db';

export interface ServiceReadingsCardProps {
  readings?: (WorkOrderReadingItem | ServiceReading)[];
  metricName: string;
  metricValue: string;
  metricUnit: string;
  onMetricNameChange: (value: string) => void;
  onMetricValueChange: (value: string) => void;
  onMetricUnitChange: (value: string) => void;
  onAddReading: () => void;
  isSyncing?: boolean;
  pendingCount?: number;
  hasSyncError?: boolean;
  onRetrySync?: () => void;
  className?: string;
}

export const ServiceReadingsCard: FC<ServiceReadingsCardProps> = ({
  readings = [],
  metricName,
  metricValue,
  metricUnit,
  onMetricNameChange,
  onMetricValueChange,
  onMetricUnitChange,
  onAddReading,
  isSyncing = false,
  pendingCount = 0,
  hasSyncError = false,
  onRetrySync,
  className = '',
}) => {
  const formatTime = (r: WorkOrderReadingItem | ServiceReading): string => {
    if ('timestamp' in r && r.timestamp) return r.timestamp;
    if ('recordedAt' in r && r.recordedAt) {
      return new Date(r.recordedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    return '';
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}>
      <div className='flex items-center justify-between pb-2 border-b border-slate-100'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
            <Activity className='w-3.5 h-3.5 stroke-[2.2]' />
          </div>
          <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>
            Structured Service Readings
          </h2>
        </div>

        <div>
          {isSyncing ? (
            <span className='text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-amber-200/80 animate-pulse'>
              <RefreshCw className='w-2.5 h-2.5 animate-spin' />
              <span>Syncing to Cloud...</span>
            </span>
          ) : hasSyncError ? (
            <button
              type='button'
              onClick={onRetrySync}
              className='text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-rose-200 transition-colors cursor-pointer'
              title='Click to retry synchronization'
            >
              <AlertCircle className='w-2.5 h-2.5 text-rose-600' />
              <span>Sync Failed • Retry</span>
            </button>
          ) : pendingCount > 0 ? (
            <span className='text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200/60'>
              <CloudOff className='w-2.5 h-2.5 text-slate-400' />
              <span>{pendingCount} saved offline</span>
            </span>
          ) : (
            <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>Real-Time Data</span>
          )}
        </div>
      </div>

      <div className='grid grid-cols-12 gap-2 pt-1'>
        <div className='col-span-5'>
          <Input
            label='Metric'
            placeholder='e.g. Suction Pressure'
            value={metricName}
            onChange={(e) => onMetricNameChange(e.target.value)}
          />
        </div>

        <div className='col-span-3'>
          <Input
            label='Value'
            placeholder='[45.2]'
            value={metricValue}
            onChange={(e) => onMetricValueChange(e.target.value)}
          />
        </div>

        <div className='col-span-2'>
          <Input
            label='Unit'
            placeholder='[PSI]'
            value={metricUnit}
            onChange={(e) => onMetricUnitChange(e.target.value)}
          />
        </div>

        <div className='col-span-2 flex items-end pb-0.5'>
          <Button
            size='sm'
            fullWidth
            onClick={onAddReading}
            className='py-3 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] text-white text-xs font-bold'
          >
            + Log
          </Button>
        </div>
      </div>

      <div className='space-y-2 pt-1 max-h-56 overflow-y-auto pr-0.5'>
        {readings.length === 0 ? (
          <p className='text-xs text-slate-400 italic py-1'>No structured service readings logged yet.</p>
        ) : (
          readings.map((r) => {
            const timeStr = formatTime(r);
            return (
              <div
                key={r.id}
                className='flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs'
              >
                <span className='text-xs font-semibold text-slate-800'>
                  {timeStr && <span className='text-slate-400 font-normal mr-2'>{timeStr} -</span>}
                  <span className='font-bold text-slate-900'>{r.metric}:</span> {r.value} {r.unit}
                </span>

                <span className='text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200'>
                  Recorded
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ServiceReadingsCard;
