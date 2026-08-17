import type { FC, ReactNode } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface EntityCardProps {
  title: string;
  subtitle?: string;
  location?: string;
  image?: string;
  avatar?: ReactNode;
  initials?: string;
  details?: Record<string, any>;
  statusBadgeValue?: boolean | string;
  leftStat?: ReactNode;
  rightStat?: ReactNode;
  rightIcon?: ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  className?: string;
}

const getInitials = (text: string): string => {
  if (!text) return '';
  const parts = text.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return text.slice(0, 2).toUpperCase();
};

export const EntityCard: FC<EntityCardProps> = ({
  title,
  subtitle,
  location,
  image,
  avatar,
  initials,
  details,
  statusBadgeValue,
  leftStat,
  rightStat,
  rightIcon,
  showChevron = true,
  onClick,
  className = '',
}) => {
  const displayInitials = initials || getInitials(title);

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden
        transition-all duration-200 select-none
        ${onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.99]' : ''}
        ${className}
      `}
    >
      <div className='p-3.5 flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          {image ? (
            <div className='w-13 h-13 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs'>
              <img src={image} alt={title} className='w-full h-full object-contain' loading='lazy' />
            </div>
          ) : avatar ? (
            <div className='shrink-0'>{avatar}</div>
          ) : (
            <div className='w-11 h-11 rounded-full bg-gradient-to-br from-rose-50 to-rose-100/70 border border-rose-200/60 flex items-center justify-center text-[#D12026] font-bold text-sm shrink-0 shadow-2xs'>
              {displayInitials}
            </div>
          )}

          <div className='min-w-0 flex-1'>
            <h3 className='font-bold text-slate-900 text-sm tracking-tight truncate leading-snug'>{title}</h3>

            {subtitle && <p className='text-xs font-semibold text-slate-600 truncate mt-0.5'>{subtitle}</p>}

            {details && (
              <div className='mt-1 space-y-0.5 text-xs'>
                {Object.keys(details).map((key) => (
                  <div key={key} className='flex items-center gap-1 text-[11px] truncate'>
                    <span className='font-semibold text-slate-500'>{key}:</span>
                    <span className='text-slate-700 truncate'>{details[key]}</span>
                  </div>
                ))}
              </div>
            )}

            {location && (
              <div className='flex items-center gap-1 text-xs text-slate-400 mt-1 truncate'>
                <MapPin className='w-3.5 h-3.5 shrink-0 text-slate-400' />
                <span className='truncate text-slate-500 font-normal'>{location}</span>
              </div>
            )}
          </div>
          {statusBadgeValue && <StatusBadge status={statusBadgeValue} />}
        </div>

        <div className='shrink-0 pl-1'>
          {rightIcon ? (
            rightIcon
          ) : showChevron ? (
            <ChevronRight className='w-4.5 h-4.5 text-slate-400 stroke-[2]' />
          ) : null}
        </div>
      </div>

      {(leftStat !== undefined || rightStat !== undefined) && (
        <div className='border-t border-slate-100 bg-slate-50/40 grid grid-cols-2 divide-x divide-slate-100 text-xs'>
          <div className='py-2 px-3 text-center truncate font-medium text-slate-600'>{leftStat ?? '—'}</div>
          <div className='py-2 px-3 text-center truncate font-bold text-[#D12026]'>{rightStat ?? '—'}</div>
        </div>
      )}
    </div>
  );
};

export default EntityCard;
