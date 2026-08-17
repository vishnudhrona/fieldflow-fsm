import type { ReactNode } from 'react';

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
  fullWidth = true,
}: TabsProps<T>) => {
  return (
    <div
      role='tablist'
      className={`
        flex items-center justify-between border-b border-slate-200 text-xs select-none
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type='button'
            role='tab'
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`
              pb-3 pt-2 px-3 text-xs font-bold transition-all relative outline-none cursor-pointer flex items-center justify-center gap-1.5 bg-transparent border-0
              ${fullWidth ? 'flex-1 text-center' : ''}
              ${
                isActive
                  ? 'text-[#D12026]'
                  : 'text-slate-500 hover:text-slate-800'
              }
              ${tab.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
              ${tabClassName}
            `}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count !== null && (
              <span className='font-bold'>({tab.count})</span>
            )}

            {isActive && (
              <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-[#D12026] rounded-full' />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
