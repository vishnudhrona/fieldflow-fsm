import { useState, useRef, type ReactNode, type ComponentType, type MouseEvent } from 'react';
import { MoreVertical } from 'lucide-react';
import { useClickOutside } from '../../hooks';
import { Button } from './Button';

export interface ActionMenuItem<T = any> {
  id?: string;
  label: string | ReactNode;
  icon?: ComponentType<{ className?: string }>;
  onClick?: (row: T) => void;
  component?: ComponentType<{ row: T }>;
  hidden?: boolean | ((row: T) => boolean);
  disabled?: boolean;
  className?: string;
  danger?: boolean;
}

export interface TableActionMenuProps<T = any> {
  actionItems?: ActionMenuItem<T>[];
  row?: T;
  disabled?: boolean;
  zIndex?: number;
  className?: string;
  triggerClassName?: string;
}

export const TableActionMenu = <T = any>({
  actionItems = [],
  row = {} as T,
  disabled = false,
  zIndex = 50,
  className = '',
  triggerClassName = '',
}: TableActionMenuProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false), isOpen);

  const visibleItems = actionItems.filter((item) => {
    if (typeof item.hidden === 'function') {
      return !item.hidden(row);
    }
    return !item.hidden;
  });

  if (visibleItems.length === 0 || disabled) return null;

  const handleTriggerClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <Button
        variant='ghost'
        size='sm'
        disabled={disabled}
        onClick={handleTriggerClick}
        aria-expanded={isOpen}
        aria-haspopup='true'
        title='Actions'
        leftIcon={<MoreVertical className='w-4 h-4' />}
        className={`w-8 h-8 p-0 rounded-lg bg-slate-100 hover:bg-[#D12026] hover:text-white text-slate-600 flex items-center justify-center border border-slate-200/70 shadow-2xs ${triggerClassName}`}
      />

      {isOpen && (
        <div
          style={{ zIndex }}
          className='absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl py-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-100 text-left'
        >
          {visibleItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id ?? (typeof item.label === 'string' ? item.label : idx)}
                variant='ghost'
                size='sm'
                fullWidth
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick?.(row);
                }}
                leftIcon={Icon ? <Icon className='w-3.5 h-3.5 shrink-0' /> : undefined}
                className={`justify-start px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#D12026] rounded-none border-0 text-left ${
                  item.danger ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' : ''
                } ${item.className || ''}`}
              >
                {item.component ? <item.component row={row} /> : item.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TableActionMenu;
