import { useState, useEffect, type FC } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Trash2,
  CheckSquare,
  Activity,
  Layers,
  Camera,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '../ui';
import { useSync } from '../../context/SyncContext';
import { useNetwork } from '../../context/NetworkContext';
import type { OutboxMutation, WorkOrderAttachment } from '../../services/db';

export interface OutboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabFilter = 'ALL' | 'MUTATIONS' | 'PHOTOS' | 'CONFLICTS';

export const OutboxDrawer: FC<OutboxDrawerProps> = ({ isOpen, onClose }) => {
  const {
    mutations,
    pendingAttachments = [],
    totalPending,
    isSyncing,
    syncNow,
    retryMutation,
    deleteMutation,
    retryPhoto,
    deletePhoto,
  } = useSync();
  const { isOnline } = useNetwork();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRetryMutation = async (id: string) => {
    setRetryingId(id);
    try {
      await retryMutation(id);
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryPhoto = async (id: string) => {
    setRetryingId(id);
    try {
      if (retryPhoto) await retryPhoto(id);
    } finally {
      setRetryingId(null);
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'UPDATE_STATUS':
        return { label: 'Status Change', icon: Activity, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'COMPLETE_JOB':
        return { label: 'Job Completed', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'UPDATE_CHECKLIST':
        return { label: 'Checklist Task', icon: CheckSquare, color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'ADD_READING':
        return { label: 'Service Reading', icon: Activity, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      default:
        return { label: actionType, icon: Layers, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    }
  };

  const formatMutationDetails = (mutation: OutboxMutation) => {
    if (mutation.actionType === 'UPDATE_STATUS') {
      return `Transition to status: ${mutation.payload.status}`;
    }
    if (mutation.actionType === 'COMPLETE_JOB') {
      return 'Mark work order as completed';
    }
    if (mutation.actionType === 'UPDATE_CHECKLIST') {
      return mutation.payload.isCompleted
        ? 'Inspection task marked as completed'
        : 'Inspection task unmarked';
    }
    if (mutation.actionType === 'ADD_READING') {
      return `${mutation.payload.metric}: ${mutation.payload.value} ${mutation.payload.unit}`;
    }
    return JSON.stringify(mutation.payload);
  };

  const failedMutationsCount = mutations.filter((m) => m.status === 'FAILED').length;
  const failedPhotosCount = pendingAttachments.filter((a) => a.status === 'FAILED').length;
  const totalFailed = failedMutationsCount + failedPhotosCount;
  const conflictCount = mutations.filter((m) => m.status === 'CONFLICT').length;

  const filteredMutations = mutations.filter((m) => {
    if (activeTab === 'PHOTOS') return false;
    if (activeTab === 'CONFLICTS') return m.status === 'CONFLICT';
    return true;
  });

  const filteredAttachments = pendingAttachments.filter(() => {
    if (activeTab === 'MUTATIONS' || activeTab === 'CONFLICTS') return false;
    return true;
  });

  const isOutboxEmpty = filteredMutations.length === 0 && filteredAttachments.length === 0;

  const drawerContent = (
    <div className='fixed inset-0 z-[9999] overflow-hidden'>
      {/* Darkened Backdrop */}
      <div
        onClick={onClose}
        className='fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 cursor-pointer'
        aria-hidden='true'
      />

      {/* Full-Height Desktop / Mobile Slide-Over Panel */}
      <div className='fixed inset-y-0 right-0 z-[10000] flex max-w-full pl-6 sm:pl-10'>
        <div className='w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 animate-in slide-in-from-right duration-300'>
          
          {/* Header */}
          <div className='p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-[#D12026] shadow-2xs shrink-0'>
                <Layers className='w-5 h-5 stroke-[2.2]' />
              </div>
              <div>
                <h2 className='text-base font-black text-slate-900 leading-tight'>Offline Outbox & Queue</h2>
                <div className='flex items-center gap-2 mt-0.5'>
                  {isOnline ? (
                    <span className='inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600'>
                      <Wifi className='w-3.5 h-3.5' /> Online (Ready to Sync)
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 animate-pulse'>
                      <WifiOff className='w-3.5 h-3.5' /> Offline (Queued Locally)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type='button'
              onClick={onClose}
              className='p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer'
              aria-label='Close drawer'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className='grid grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-50 border-b border-slate-100 text-center shrink-0'>
            <div className='bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Pending</span>
              <span className='text-base font-black text-amber-600'>{totalPending}</span>
            </div>

            <div className='bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Syncing</span>
              <span className='text-base font-black text-blue-600'>{isSyncing ? 'Active' : 'Idle'}</span>
            </div>

            <div className='bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Failed</span>
              <span className='text-base font-black text-rose-600'>{totalFailed}</span>
            </div>

            <div className='bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Conflict</span>
              <span className='text-base font-black text-purple-600'>{conflictCount}</span>
            </div>
          </div>

          <div className='flex items-center px-4 pt-2.5 pb-2 border-b border-slate-100 gap-1.5 shrink-0 bg-white overflow-x-auto'>
            <button
              type='button'
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Items ({mutations.length + pendingAttachments.length})
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('MUTATIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'MUTATIONS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mutations ({mutations.length})
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('PHOTOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'PHOTOS'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Photos ({pendingAttachments.length})
            </button>
            {conflictCount > 0 && (
              <button
                type='button'
                onClick={() => setActiveTab('CONFLICTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'CONFLICTS'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                Conflicts ({conflictCount})
              </button>
            )}
          </div>

          {/* Scrollable Items List */}
          <div className='flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/50'>
            {isOutboxEmpty ? (
              <div className='h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400'>
                <div className='w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs'>
                  <CheckCircle2 className='w-7 h-7 stroke-[2.2]' />
                </div>
                <div className='space-y-1'>
                  <h3 className='text-sm font-bold text-slate-800'>Queue is Clear</h3>
                  <p className='text-xs text-slate-400 max-w-xs'>
                    All offline changes, status transitions, checklists, readings, and photos are synchronized with the cloud.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Mutations */}
                {filteredMutations.map((mutation) => {
                  const actionMeta = getActionLabel(mutation.actionType);
                  const ActionIcon = actionMeta.icon;

                  return (
                    <div
                      key={mutation.mutationId}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-2xs bg-white ${
                        mutation.status === 'FAILED'
                          ? 'border-rose-300 bg-rose-50/20'
                          : mutation.status === 'CONFLICT'
                          ? 'border-purple-300 bg-purple-50/20'
                          : mutation.status === 'SYNCING'
                          ? 'border-blue-300 bg-blue-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className='flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${actionMeta.color}`}
                          >
                            <ActionIcon className='w-3 h-3' />
                            <span>{actionMeta.label}</span>
                          </span>

                          <span className='text-[10px] font-bold text-slate-400 font-mono'>
                            {formatRelativeTime(mutation.timestamp)}
                          </span>
                        </div>

                        <div className='flex items-center gap-1'>
                          {mutation.status === 'PENDING' && (
                            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200'>
                              Pending
                            </span>
                          )}

                          {mutation.status === 'SYNCING' && (
                            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1'>
                              <RefreshCw className='w-2.5 h-2.5 animate-spin' />
                              Syncing
                            </span>
                          )}

                          {mutation.status === 'CONFLICT' && (
                            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1'>
                              <AlertTriangle className='w-2.5 h-2.5' />
                              Conflict
                            </span>
                          )}

                          {mutation.status === 'FAILED' && (
                            <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200'>
                              Failed ({mutation.retryCount})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className='pt-2.5 space-y-1.5'>
                        <p className='text-xs font-bold text-slate-900 leading-snug'>
                          {formatMutationDetails(mutation)}
                        </p>

                        <div className='flex items-center justify-between text-[11px] text-slate-500'>
                          <span className='font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200'>
                            {mutation.orderNumber || mutation.workOrderId.substring(0, 8)}
                          </span>
                          <span className='text-[10px] text-slate-400 font-mono'>
                            {new Date(mutation.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        {mutation.errorMessage && (
                          <p className='text-[10px] text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200 font-medium'>
                            {mutation.errorMessage}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className='mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-2'>
                        <button
                          type='button'
                          onClick={() => deleteMutation(mutation.mutationId)}
                          className='p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer'
                          title='Discard Mutation'
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                        </button>

                        {(mutation.status === 'FAILED' || mutation.status === 'CONFLICT') && (
                          <Button
                            size='sm'
                            variant='outline'
                            isLoading={retryingId === mutation.mutationId}
                            onClick={() => handleRetryMutation(mutation.mutationId)}
                            leftIcon={<RefreshCw className='w-3 h-3' />}
                            className='text-[11px] py-1 px-3 rounded-lg font-bold'
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pending Photo Uploads */}
                {filteredAttachments.map((att: WorkOrderAttachment) => (
                  <div
                    key={att.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all shadow-2xs bg-white ${
                      att.status === 'FAILED'
                        ? 'border-rose-300 bg-rose-50/20'
                        : att.status === 'UPLOADING'
                        ? 'border-blue-300 bg-blue-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100'>
                      <div className='flex items-center gap-2'>
                        <span className='text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 text-purple-700 bg-purple-50 border-purple-200'>
                          <Camera className='w-3 h-3' />
                          <span>Site Photo</span>
                        </span>
                        <span className='text-[10px] font-bold text-slate-400 font-mono'>
                          {att.timestamp}
                        </span>
                      </div>

                      <div className='flex items-center gap-1'>
                        {att.status === 'PENDING' && (
                          <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200'>
                            Pending
                          </span>
                        )}
                        {att.status === 'UPLOADING' && (
                          <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1'>
                            <RefreshCw className='w-2.5 h-2.5 animate-spin' />
                            Uploading
                          </span>
                        )}
                        {att.status === 'FAILED' && (
                          <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200'>
                            Failed ({att.retryCount})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className='pt-2.5 flex items-center gap-3'>
                      <div className='w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs'>
                        {att.previewUrl || att.url ? (
                          <img src={att.previewUrl || att.url} alt={att.name} className='w-full h-full object-cover' />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center text-slate-400'>
                            <Camera className='w-5 h-5' />
                          </div>
                        )}
                      </div>
                      <div className='min-w-0 flex-1 space-y-0.5'>
                        <p className='text-xs font-bold text-slate-900 truncate'>{att.name}</p>
                        <p className='text-[10px] text-slate-500 font-mono truncate'>
                          <span className='font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200'>
                            {att.orderNumber || att.workOrderId.substring(0, 8)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {att.errorMessage && (
                      <p className='text-[10px] text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200 mt-2.5 font-medium'>
                        {att.errorMessage}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className='mt-3 pt-2 border-t border-slate-100 flex items-center justify-end gap-2'>
                      {deletePhoto && (
                        <button
                          type='button'
                          onClick={() => deletePhoto(att.id)}
                          className='p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer'
                          title='Discard Photo'
                        >
                          <Trash2 className='w-3.5 h-3.5' />
                        </button>
                      )}

                      {att.status === 'FAILED' && (
                        <Button
                          size='sm'
                          variant='outline'
                          isLoading={retryingId === att.id}
                          onClick={() => handleRetryPhoto(att.id)}
                          leftIcon={<RefreshCw className='w-3 h-3' />}
                          className='text-[11px] py-1 px-3 rounded-lg font-bold'
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Sticky Footer Action Bar */}
          <div className='p-4 sm:p-5 border-t border-slate-100 bg-white space-y-2 shrink-0'>
            <Button
              fullWidth
              onClick={syncNow}
              disabled={!isOnline || totalPending === 0 || isSyncing}
              isLoading={isSyncing}
              leftIcon={<RefreshCw className='w-4 h-4' />}
              className='bg-[#D12026] hover:bg-[#B11A1F] text-white py-3.5 rounded-xl font-bold text-xs shadow-md border-0'
            >
              {isSyncing
                ? 'Synchronizing Queue...'
                : totalPending > 0
                ? `Sync All Changes Now (${totalPending})`
                : 'All Changes Synchronized'}
            </Button>

            {!isOnline && (
              <p className='text-[11px] text-center text-amber-600 font-semibold'>
                Device is offline. Changes will auto-sync when network reconnects.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null;
};

export default OutboxDrawer;
