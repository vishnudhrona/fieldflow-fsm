import type { FC } from 'react';
import { Check, ClipboardList } from 'lucide-react';
import type { WorkOrderChecklistItem } from '../../services/workOrderService';

export interface ServiceChecklistCardProps {
  checklistItems?: WorkOrderChecklistItem[];
  onToggleItem: (checklistId: string, currentStatus: boolean) => void;
  className?: string;
}

export const ServiceChecklistCard: FC<ServiceChecklistCardProps> = ({
  checklistItems = [],
  onToggleItem,
  className = '',
}) => {
  const completedCount = checklistItems.filter((i) => i.isCompleted).length;
  const totalCount = checklistItems.length;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}>
      <div className='flex items-center justify-between pb-2 border-b border-slate-100'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
            <ClipboardList className='w-3.5 h-3.5 stroke-[2.2]' />
          </div>
          <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>Service Checklist</h2>
        </div>

        <span className='text-[10px] font-bold text-[#D12026] bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full'>
          {completedCount} of {totalCount} Completed
        </span>
      </div>

      {totalCount === 0 ? (
        <p className='text-xs text-slate-400 italic py-2'>No inspection steps assigned for this job.</p>
      ) : (
        <div className='space-y-2'>
          {checklistItems.map((item) => (
            <div
              key={item.id}
              role='button'
              tabIndex={0}
              onClick={() => {
                onToggleItem(item.id, item.isCompleted)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleItem(item.id, item.isCompleted);
                }
              }}
              className='flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-colors cursor-pointer group border border-slate-100/80 hover:border-slate-200 shadow-2xs select-none'
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all shadow-2xs ${
                  item.isCompleted
                    ? 'bg-[#D12026] text-white border-0'
                    : 'border-2 border-slate-300 bg-white group-hover:border-[#D12026]'
                }`}
              >
                {item.isCompleted && <Check className='w-3.5 h-3.5 stroke-[3]' />}
              </div>

              <span
                className={`text-xs font-medium leading-snug ${
                  item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                }`}
              >
                {item.taskDescription}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceChecklistCard;
