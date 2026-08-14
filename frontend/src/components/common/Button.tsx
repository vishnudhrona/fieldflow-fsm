import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonColor =
  | 'sky'
  | 'blue'
  | 'emerald'
  | 'indigo'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'white';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// Color palettes per variant
const primaryColorStyles: Record<ButtonColor, string> = {
  sky: 'bg-sky-500 text-slate-950 hover:bg-sky-400 border-sky-400/30 focus-visible:ring-sky-400',
  blue: 'bg-blue-600 text-white hover:bg-blue-500 border-blue-500/30 focus-visible:ring-blue-400',
  emerald: 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 border-emerald-400/30 focus-visible:ring-emerald-400',
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-500 border-indigo-500/30 focus-visible:ring-indigo-400',
  violet: 'bg-violet-600 text-white hover:bg-violet-500 border-violet-500/30 focus-visible:ring-violet-400',
  amber: 'bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-400/30 focus-visible:ring-amber-400',
  rose: 'bg-rose-600 text-white hover:bg-rose-500 border-rose-500/30 focus-visible:ring-rose-400',
  slate: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700 focus-visible:ring-slate-400',
  white: 'bg-white text-slate-950 hover:bg-slate-100 border-slate-200 focus-visible:ring-slate-300'
};

const secondaryColorStyles: Record<ButtonColor, string> = {
  sky: 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border-sky-500/30 focus-visible:ring-sky-400',
  blue: 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border-blue-500/30 focus-visible:ring-blue-400',
  emerald: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30 focus-visible:ring-emerald-400',
  indigo: 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border-indigo-500/30 focus-visible:ring-indigo-400',
  violet: 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border-violet-500/30 focus-visible:ring-violet-400',
  amber: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border-amber-500/30 focus-visible:ring-amber-400',
  rose: 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border-rose-500/30 focus-visible:ring-rose-400',
  slate: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700 focus-visible:ring-slate-400',
  white: 'bg-white/10 text-white hover:bg-white/20 border-white/20 focus-visible:ring-white'
};

const outlineColorStyles: Record<ButtonColor, string> = {
  sky: 'bg-transparent text-sky-400 border-sky-500/40 hover:bg-sky-500/10 focus-visible:ring-sky-400',
  blue: 'bg-transparent text-blue-400 border-blue-500/40 hover:bg-blue-500/10 focus-visible:ring-blue-400',
  emerald: 'bg-transparent text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 focus-visible:ring-emerald-400',
  indigo: 'bg-transparent text-indigo-400 border-indigo-500/40 hover:bg-indigo-500/10 focus-visible:ring-indigo-400',
  violet: 'bg-transparent text-violet-400 border-violet-500/40 hover:bg-violet-500/10 focus-visible:ring-violet-400',
  amber: 'bg-transparent text-amber-400 border-amber-500/40 hover:bg-amber-500/10 focus-visible:ring-amber-400',
  rose: 'bg-transparent text-rose-400 border-rose-500/40 hover:bg-rose-500/10 focus-visible:ring-rose-400',
  slate: 'bg-transparent text-slate-200 border-slate-700 hover:bg-slate-800 focus-visible:ring-slate-400',
  white: 'bg-transparent text-white border-white/40 hover:bg-white/10 focus-visible:ring-white'
};

const ghostColorStyles: Record<ButtonColor, string> = {
  sky: 'bg-transparent text-sky-400 hover:bg-sky-500/10 focus-visible:ring-sky-400 border-transparent',
  blue: 'bg-transparent text-blue-400 hover:bg-blue-500/10 focus-visible:ring-blue-400 border-transparent',
  emerald: 'bg-transparent text-emerald-400 hover:bg-emerald-500/10 focus-visible:ring-emerald-400 border-transparent',
  indigo: 'bg-transparent text-indigo-400 hover:bg-indigo-500/10 focus-visible:ring-indigo-400 border-transparent',
  violet: 'bg-transparent text-violet-400 hover:bg-violet-500/10 focus-visible:ring-violet-400 border-transparent',
  amber: 'bg-transparent text-amber-400 hover:bg-amber-500/10 focus-visible:ring-amber-400 border-transparent',
  rose: 'bg-transparent text-rose-400 hover:bg-rose-500/10 focus-visible:ring-rose-400 border-transparent',
  slate: 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-slate-400 border-transparent',
  white: 'bg-transparent text-white hover:bg-white/10 focus-visible:ring-white border-transparent'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5'
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      color = 'sky',
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
    let colorStyle = primaryColorStyles[color];
    if (variant === 'secondary') colorStyle = secondaryColorStyles[color];
    if (variant === 'outline') colorStyle = outlineColorStyles[color];
    if (variant === 'ghost') colorStyle = ghostColorStyles[color];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 outline-none select-none border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 active:scale-[0.99] cursor-pointer',
          colorStyle,
          sizeStyles[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}

        {children && <span>{children}</span>}

        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
