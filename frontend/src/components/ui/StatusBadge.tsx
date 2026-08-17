import type { FC, ReactNode } from 'react';

export type StatusType =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'UNDER_SERVICE'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'URGENT'
  | 'HIGH'
  | 'NORMAL'
  | 'LOW'
  | string
  | boolean;

export interface StatusBadgeProps {
  status: StatusType;
  label?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
  rounded?: 'md' | 'lg' | 'full';
  dot?: boolean;
  className?: string;
}

const statusColorMap: Record<string, { bg: string; text: string; border: string; dot: string; defaultLabel: string }> = {
  ACTIVE: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: 'Active',
  },
  INACTIVE: {
    bg: 'bg-red-100',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-400',
    defaultLabel: 'Inactive',
  },
  UNDER_SERVICE: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    defaultLabel: 'Under Service',
  },
  IN_PROGRESS: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    defaultLabel: 'In Progress',
  },
  PENDING: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    defaultLabel: 'Pending',
  },
  COMPLETED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: 'Completed',
  },
  URGENT: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    defaultLabel: 'Urgent',
  },
  HIGH: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    defaultLabel: 'High Priority',
  },
  NORMAL: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    defaultLabel: 'Normal',
  },
  LOW: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    defaultLabel: 'Low',
  },
};

const sizeStyles = {
  xs: 'text-[10px] px-2 py-0.5',
  sm: 'text-[11px] px-2.5 py-0.5',
  md: 'text-xs px-3 py-1',
};

const roundedStyles = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export const StatusBadge: FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  rounded = 'md',
  dot = false,
  className = '',
}) => {
  const normalizedKey =
    typeof status === 'boolean'
      ? status
        ? 'ACTIVE'
        : 'INACTIVE'
      : typeof status === 'string'
      ? status.toUpperCase().replace(/\s+/g, '_')
      : 'INACTIVE';

  const config =
    statusColorMap[normalizedKey] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      defaultLabel: typeof status === 'string' ? status : 'Unknown',
    };

  const displayText = label !== undefined ? label : config.defaultLabel;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-bold border shrink-0 select-none
        ${config.bg}
        ${config.text}
        ${config.border}
        ${sizeStyles[size]}
        ${roundedStyles[rounded]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      )}
      <span>{displayText}</span>
    </span>
  );
};

export default StatusBadge;
