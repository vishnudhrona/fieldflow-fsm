import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type InputColor =
  | 'sky'
  | 'blue'
  | 'emerald'
  | 'indigo'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'white';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  helperText?: string;
  color?: InputColor;
  bgColor?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  required?: boolean;
}

const inputColorStyles: Record<InputColor, string> = {
  sky: 'focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20',
  blue: 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20',
  emerald: 'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20',
  indigo: 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20',
  violet: 'focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20',
  amber: 'focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20',
  rose: 'focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026]/20',
  slate: 'focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20',
  white: 'focus:border-white focus:ring-1 focus:ring-white/20'
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      color = 'rose',
      bgColor = 'bg-white',
      leftIcon,
      rightIcon,
      id,
      className = '',
      containerClassName = '',
      labelClassName = '',
      required = false,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn('block text-xs font-bold text-slate-800', labelClassName)}
          >
            {label}
            {required && <span className='text-[#D12026] ml-0.5'>*</span>}
          </label>
        )}

        <div className='relative flex items-center'>
          {leftIcon && (
            <div className='pointer-events-none absolute left-3 flex items-center text-slate-400'>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all',
              bgColor,
              inputColorStyles[color],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#D12026] focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026]',
              disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
              className
            )}
            {...rest}
          />

          {rightIcon && (
            <div className='absolute right-3 flex items-center text-slate-400'>
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className='text-[11px] text-[#D12026] font-medium'>{error}</p>
        ) : helperText ? (
          <p className='text-xs text-slate-500'>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
