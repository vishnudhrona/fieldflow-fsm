import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#D12026] text-white hover:bg-[#B11A1F] active:bg-[#911519] border-transparent shadow-xs',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200/80 active:bg-slate-200 border-slate-200/70',
  outline: 'bg-transparent text-slate-700 hover:text-[#D12026] border-slate-200 hover:border-[#D12026]/40 hover:bg-rose-50/50',
  ghost: 'bg-transparent text-slate-600 hover:text-[#D12026] hover:bg-slate-100 border-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border-transparent shadow-xs',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-bold transition-all duration-150 outline-none select-none border focus-visible:ring-2 focus-visible:ring-[#D12026]/30 active:scale-[0.99] cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className='w-4 h-4 animate-spin shrink-0' />
        ) : (
          <>
            {leftIcon && <span className='shrink-0 flex items-center justify-center'>{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className='shrink-0 flex items-center justify-center'>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
