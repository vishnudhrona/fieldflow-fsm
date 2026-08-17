import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ToggleColor =
  | 'rose'
  | 'sky'
  | 'blue'
  | 'emerald'
  | 'indigo'
  | 'amber'
  | 'slate';

export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  color?: ToggleColor;
  size?: ToggleSize;
  containerClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

const colorStyles: Record<ToggleColor, string> = {
  rose: 'bg-[#D12026]',
  sky: 'bg-sky-500',
  blue: 'bg-blue-600',
  emerald: 'bg-emerald-500',
  indigo: 'bg-indigo-600',
  amber: 'bg-amber-500',
  slate: 'bg-slate-700',
};

const sizeStyles: Record<
  ToggleSize,
  {
    track: string;
    thumb: string;
    translate: string;
  }
> = {
  sm: {
    track: 'w-8 h-4.5 p-0.5',
    thumb: 'w-3.5 h-3.5',
    translate: 'translate-x-3.5',
  },
  md: {
    track: 'w-11 h-6 p-0.5',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7.5 p-1',
    thumb: 'w-5.5 h-5.5',
    translate: 'translate-x-6.5',
  },
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      onChange,
      label,
      description,
      color = 'rose',
      size = 'md',
      disabled = false,
      className = '',
      containerClassName = '',
      labelClassName = '',
      descriptionClassName = '',
      id,
      ...rest
    },
    ref
  ) => {
    const handleToggle = () => {
      if (!disabled) {
        onChange(!checked);
      }
    };

    const currentSize = sizeStyles[size];
    const currentColor = colorStyles[color];

    const switchElement = (
      <button
        ref={ref}
        id={id}
        type='button'
        role='switch'
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none select-none items-center border-0 outline-none',
          currentSize.track,
          checked ? currentColor : 'bg-slate-300',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...rest}
      >
        <span
          aria-hidden='true'
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
            currentSize.thumb,
            checked ? currentSize.translate : 'translate-x-0'
          )}
        />
      </button>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer select-none transition-all hover:bg-slate-100/60',
          disabled && 'opacity-60 cursor-not-allowed',
          containerClassName
        )}
        onClick={handleToggle}
      >
        <div className='flex flex-col pr-3'>
          {label && (
            <span className={cn('text-xs font-bold text-slate-900', labelClassName)}>
              {label}
            </span>
          )}
          {description && (
            <span className={cn('text-[11px] text-slate-500 mt-0.5', descriptionClassName)}>
              {description}
            </span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>{switchElement}</div>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
