import type { FC, ReactNode, ComponentType } from 'react';
import { Package } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string; size?: number }> | ReactNode;
  actionText?: string;
  onAction?: () => void;
  card?: boolean;
  className?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  card = true,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) {
      return (
        <div className='w-18 h-18 rounded-full bg-rose-50/90 border border-rose-100 flex items-center justify-center text-[#D12026] shadow-2xs'>
          <Package className='w-8 h-8 stroke-[1.75]' />
        </div>
      );
    }

    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && 'render' in (icon as any))
    ) {
      const IconComponent = icon as ComponentType<{ className?: string; size?: number }>;
      return (
        <div className='w-18 h-18 rounded-full bg-rose-50/90 border border-rose-100 flex items-center justify-center text-[#D12026] shadow-2xs'>
          <IconComponent className='w-8 h-8 stroke-[1.75]' />
        </div>
      );
    }

    return icon;
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center select-none
        ${card ? 'bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-2xs' : 'py-8'}
        ${className}
      `}
    >
      <div className='mb-3.5'>{renderIcon()}</div>

      <h3 className='font-bold text-slate-900 text-sm sm:text-base tracking-tight'>
        {title}
      </h3>

      {description && (
        <p className='text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed'>
          {description}
        </p>
      )}

      {actionText && onAction && (
        <div className='mt-5'>
          <Button
            type='button'
            onClick={onAction}
            className='py-2.5 px-6 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] text-white font-bold text-xs shadow-sm inline-flex items-center gap-1.5 transition-all border-0 cursor-pointer'
          >
            <span>{actionText}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
