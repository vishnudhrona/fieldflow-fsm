import type { FC, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY' | string;

export interface PriorityOption {
  id: PriorityLevel;
  label: string;
  dotColor: string;
  activeClass: string;
  inactiveClass: string;
}

export const DEFAULT_PRIORITY_OPTIONS: PriorityOption[] = [
  {
    id: 'LOW',
    label: 'Low',
    dotColor: 'bg-emerald-500',
    activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30 font-bold',
    inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal',
  },
  {
    id: 'MEDIUM',
    label: 'Medium',
    dotColor: 'bg-amber-500',
    activeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/30 font-bold',
    inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal',
  },
  {
    id: 'HIGH',
    label: 'High',
    dotColor: 'bg-orange-500',
    activeClass: 'bg-orange-50 text-orange-800 border-orange-300 ring-1 ring-orange-400/30 font-bold',
    inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal',
  },
  {
    id: 'EMERGENCY',
    label: 'Emergency',
    dotColor: 'bg-rose-500',
    activeClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-400/30 font-extrabold',
    inactiveClass: 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal',
  },
];

export interface PrioritySelectorProps {
  label?: ReactNode;
  value?: PriorityLevel;
  onChange?: (priority: any) => void;
  options?: PriorityOption[];
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const PrioritySelector: FC<PrioritySelectorProps> = ({
  label = 'Priority Level',
  value = 'MEDIUM',
  onChange,
  options = DEFAULT_PRIORITY_OPTIONS,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  containerClassName = '',
  labelClassName = '',
}) => {
  return (
    <div className={cn('w-full space-y-1.5', containerClassName)}>
      {label && (
        <label className={cn('block text-xs font-bold text-slate-800', labelClassName)}>
          {label}
          {required && <span className='text-[#D12026] ml-0.5'>*</span>}
        </label>
      )}

      <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2.5', className)}>
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <Button
              key={opt.id}
              type='button'
              disabled={disabled}
              onClick={() => !disabled && onChange?.(opt.id)}
              leftIcon={<span className={cn('w-2 h-2 rounded-full shrink-0', opt.dotColor)} />}
              className={cn(
                'w-full py-2.5 px-3 rounded-xl border text-xs shadow-2xs transition-all',
                isSelected ? opt.activeClass : opt.inactiveClass
              )}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      {error ? (
        <p className='text-[11px] text-[#D12026] font-medium'>{error}</p>
      ) : helperText ? (
        <p className='text-xs text-slate-500'>{helperText}</p>
      ) : null}
    </div>
  );
};

export default PrioritySelector;
