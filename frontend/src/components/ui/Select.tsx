import { useState, useRef, useEffect, type FC, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  image?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  label?: ReactNode;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  leftIcon?: ReactNode;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const Select: FC<SelectProps> = ({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  leftIcon,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  labelClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string, isOptDisabled?: boolean) => {
    if (isOptDisabled || disabled) return;
    onChange?.({ target: { value: optValue } });
    setIsOpen(false);
  };

  const selectId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div ref={containerRef} className={cn('w-full space-y-1.5 relative', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className={cn('block text-xs font-bold text-slate-800', labelClassName)}>
          {label}
          {required && <span className='text-[#D12026] ml-0.5'>*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        id={selectId}
        role='combobox'
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        className={cn(
          'w-full flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 transition-all select-none cursor-pointer outline-none focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026]/20 shadow-2xs',
          isOpen && 'border-[#D12026] ring-1 ring-[#D12026]/20',
          error && 'border-[#D12026] focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026]',
          disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
          className
        )}
      >
        <div className='flex items-center gap-2.5 min-w-0 flex-1 pr-2'>
          {/* Active Thumbnail / Icon */}
          {selectedOption?.image ? (
            <div className='w-6 h-6 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs'>
              <img src={selectedOption.image} alt='' className='w-full h-full object-contain' />
            </div>
          ) : selectedOption?.icon ? (
            <div className='shrink-0 text-slate-400'>{selectedOption.icon}</div>
          ) : leftIcon ? (
            <div className='shrink-0 text-slate-400'>{leftIcon}</div>
          ) : null}

          <div className='flex flex-col truncate leading-tight'>
            <span className={cn('truncate', !selectedOption && 'text-slate-400 font-normal')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.subLabel && (
              <span className='text-[10px] text-slate-400 truncate'>{selectedOption.subLabel}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200', isOpen && 'rotate-180 text-slate-600')}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute left-0 top-full mt-1.5 w-full z-50 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto p-1.5 space-y-0.5'>
          {options.length === 0 ? (
            <div className='p-3 text-center text-xs text-slate-400 font-medium'>No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  role='option'
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer select-none transition-colors gap-2.5',
                    isSelected
                      ? 'bg-rose-50/80 text-[#D12026] font-bold'
                      : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100',
                    opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                    {/* Item Image or Icon in Dropdown Menu */}
                    {opt.image ? (
                      <div className='w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs'>
                        <img src={opt.image} alt='' className='w-full h-full object-contain' />
                      </div>
                    ) : opt.icon ? (
                      <div className='w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-500'>
                        {opt.icon}
                      </div>
                    ) : null}

                    <div className='flex flex-col min-w-0 flex-1 leading-tight'>
                      <span className='truncate'>{opt.label}</span>
                      {opt.subLabel && (
                        <span className={cn('text-[10px] truncate', isSelected ? 'text-rose-500' : 'text-slate-400')}>
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check className='w-4 h-4 text-[#D12026] shrink-0' />}
                </div>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <p className='text-[11px] text-[#D12026] font-medium'>{error}</p>
      ) : helperText ? (
        <p className='text-xs text-slate-500'>{helperText}</p>
      ) : null}
    </div>
  );
};

export default Select;
