import type { FC } from 'react';
import { History, CheckCircle2, FileText, Image, Clock, ArrowRightCircle } from 'lucide-react';
import type { WorkOrderHistoryItem } from '../../services/workOrderService';
import type { AuditTrailItem } from '../../services/db';

export type HistoryDisplayItem = WorkOrderHistoryItem | AuditTrailItem;

export interface AuditTrailCardProps {
  history?: HistoryDisplayItem[];
  className?: string;
}

export const AuditTrailCard: FC<AuditTrailCardProps> = ({ history = [], className = '' }) => {
  // Sort history newest first
  const sortedHistory = [...history].sort((a, b) => {
    const getTime = (item: HistoryDisplayItem): number => {
      if ('createdAt' in item && typeof item.createdAt === 'string') {
        const parsed = new Date(item.createdAt).getTime();
        return isNaN(parsed) ? 0 : parsed;
      }
      if ('timestamp' in item && typeof item.timestamp === 'number') {
        return item.timestamp;
      }
      return 0;
    };
    return getTime(b) - getTime(a);
  });

  const getActionIcon = (action?: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('PHOTO')) return <Image className='w-3.5 h-3.5 text-blue-600' />;
    if (act.includes('NOTE')) return <FileText className='w-3.5 h-3.5 text-amber-600' />;
    if (act.includes('COMPLET')) return <CheckCircle2 className='w-3.5 h-3.5 text-emerald-600' />;
    if (act.includes('STATUS')) return <ArrowRightCircle className='w-3.5 h-3.5 text-purple-600' />;
    if (act.includes('CHECKLIST')) return <CheckCircle2 className='w-3.5 h-3.5 text-indigo-600' />;
    return <Clock className='w-3.5 h-3.5 text-slate-500' />;
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}>
      <div className='flex items-center justify-between pb-1 border-b border-slate-100'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
            <History className='w-3.5 h-3.5 stroke-[2.2]' />
          </div>
          <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>
            Audit Trail & History
          </h2>
        </div>
        <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>Immutable Log</span>
      </div>

      <div className='space-y-3 pt-1 max-h-56 overflow-y-auto pr-1'>
        {sortedHistory.length === 0 ? (
          <p className='text-xs text-slate-400 italic py-2'>No audit history recorded yet.</p>
        ) : (
          sortedHistory.map((item) => {
            const title =
              ('action' in item && item.action.replace(/_/g, ' ')) ||
              ('title' in item && item.title) ||
              'Activity Logged';

            const user = 'user' in item && item.user ? item.user.name : null;

            const timeStr =
              ('time' in item && item.time) ||
              ('createdAt' in item && item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })
                : '');

            return (
              <div key={item.id} className='flex items-start gap-2.5'>
                <div className='w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5'>
                  {getActionIcon(title)}
                </div>

                <div className='space-y-0.5 text-xs flex-1 min-w-0'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-1.5 flex-wrap'>
                      <span className='font-bold text-slate-900 capitalize'>{title.toLowerCase()}</span>
                      {user && (
                        <span className='text-[10px] text-slate-500 font-medium'>by {user}</span>
                      )}
                    </div>
                    <span className='text-[10px] text-slate-400 font-medium shrink-0'>{timeStr}</span>
                  </div>
                  <p className='text-slate-600 text-[11px] leading-relaxed'>{item.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AuditTrailCard;
