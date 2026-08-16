import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

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
  rose: 'bg-[#D12026] hover:bg-[#D12026]',
  sky: 'bg-sky-500 hover:bg-sky-500',
  blue: 'bg-blue-600 hover:bg-blue-600',
  emerald: 'bg-emerald-500 hover:bg-emerald-500',
  indigo: 'bg-indigo-600 hover:bg-indigo-600',
  amber: 'bg-amber-500 hover:bg-amber-500',
  slate: 'bg-slate-700 hover:bg-slate-700',
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
    track: 'h-5 w-9',
    thumb: 'h-4 w-4',
    translate: 'translate-x-4',
  },
  md: {
    track: 'h-6 w-11',
    thumb: 'h-5 w-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'h-7 w-14',
    thumb: 'h-6 w-6',
    translate: 'translate-x-7',
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
      <Button
        ref={ref}
        id={id}
        variant='ghost'
        role='switch'
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex shrink-0 p-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shadow-none hover:bg-transparent min-w-0',
          currentSize.track,
          checked ? currentColor : 'bg-slate-300 hover:bg-slate-300',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...rest}
      >
        <span
          className={cn(
            'pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            currentSize.thumb,
            checked ? currentSize.translate : 'translate-x-0'
          )}
        />
      </Button>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer select-none',
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
            <span className={cn('text-[11px] text-slate-500', descriptionClassName)}>
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
