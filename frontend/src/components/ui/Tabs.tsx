import type { ReactNode } from 'react';
import { Button } from './Button';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  count?: number | string;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  className?: string;
  tabClassName?: string;
  fullWidth?: boolean;
}

export const Tabs = <T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  tabClassName = '',
  fullWidth = false,
}: TabsProps<T>) => {
  return (
    <div
      role='tablist'
      className={`
        flex justify-between border-b border-slate-200/90 text-xs select-none
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant='ghost'
            role='tab'
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`
              pb-2.5 px-3 pt-0 font-bold transition-all relative rounded-none border-0 shadow-none hover:bg-transparent
              ${fullWidth ? 'flex-1 text-center' : ''}
              ${
                isActive
                  ? 'text-[#D12026] hover:text-[#D12026]'
                  : 'text-slate-500 hover:text-slate-800'
              }
              ${tabClassName}
            `}
          >
            <span className='inline-flex items-center gap-1'>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span className='font-bold'>({tab.count})</span>
              )}
            </span>

            {isActive && (
              <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#D12026] rounded-full' />
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default Tabs;
