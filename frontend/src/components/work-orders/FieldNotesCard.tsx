import { useEffect, useState, type FC, type KeyboardEvent } from 'react';
import { MessageSquareText, RefreshCw, AlertCircle, CloudOff } from 'lucide-react';
import { Input } from '../ui';
import type { WorkOrderNoteItem } from '../../services/workOrderService';
import { useNetwork } from '../../context/NetworkContext';

export interface FieldNotesCardProps {
  notes?: WorkOrderNoteItem[];
  newNoteText: string;
  onNoteTextChange: (value: string) => void;
  onAddNote: () => void;
  isSyncing?: boolean;
  pendingCount?: number;
  hasSyncError?: boolean;
  onRetrySync?: () => void;
  className?: string;
}

export const FieldNotesCard: FC<FieldNotesCardProps> = ({
  notes = [],
  newNoteText,
  onNoteTextChange,
  onAddNote,
  isSyncing = false,
  pendingCount = 0,
  hasSyncError = false,
  onRetrySync,
  className = '',
}) => {
  const { isOnline } = useNetwork();
  const [value, setValue] = useState(false);

  useEffect(() => {
    if (isOnline) setValue(true);
  }, [isOnline, value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddNote();
    }
  };

  const sortedNotes = [...notes].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3 ${className}`}>
      <div className='flex items-center justify-between pb-1 border-b border-slate-100'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
            <MessageSquareText className='w-3.5 h-3.5 stroke-[2.2]' />
          </div>
          <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>Field Notes</h2>
        </div>

        {/* Sync Status Badge / Retry Action */}
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
          ) : null}
        </div>
      </div>

      <div className='pt-1'>
        <Input
          placeholder='Add observation or note (Press Enter to post)...'
          value={newNoteText}
          onChange={(e) => onNoteTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className='space-y-3 pt-1 max-h-48 overflow-y-auto pr-1'>
        {sortedNotes.length === 0 ? (
          <p className='text-xs text-slate-400 italic py-2'>No field notes recorded yet.</p>
        ) : (
          sortedNotes.map((note) => {
            const authorName = note.user?.name || (note.type === 'SYSTEM' ? 'System Update' : 'Field Note');
            const authorRole = note.user?.role ? note.user.role.replace('_', ' ') : null;
            const initial = note.type === 'SYSTEM' ? 'S' : authorName.charAt(0).toUpperCase() || 'N';

            const timeStr = note.createdAt
              ? new Date(note.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : '';

            return (
              <div key={note.id} className='flex items-start gap-2.5'>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    note.type === 'SYSTEM'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-rose-50 text-[#D12026] border border-rose-200/60'
                  }`}
                >
                  {initial}
                </div>

                <div className='space-y-0.5 text-xs flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-1.5'>
                    <div className='flex items-center gap-1.5'>
                      <span className='font-bold text-slate-900'>{authorName}</span>
                      {authorRole && (
                        <span className='text-[9px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded'>
                          {authorRole}
                        </span>
                      )}
                    </div>
                    <span className='text-[10px] text-slate-400 font-medium'>{timeStr}</span>
                  </div>
                  <p className='text-slate-700 leading-relaxed text-[11px]'>{note.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FieldNotesCard;
