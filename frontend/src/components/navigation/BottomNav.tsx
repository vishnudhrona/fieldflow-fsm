import type { FC, ReactNode, ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number; fill?: string; strokeWidth?: number }> | ReactNode;
  activeIcon?: ComponentType<{ className?: string; size?: number; fill?: string; strokeWidth?: number }> | ReactNode;
  path?: string;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  onClick?: (item: BottomNavItem) => void;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeId?: string;
  onChange?: (id: string, item: BottomNavItem) => void;
  activeColor?: string;
  inactiveColor?: string;
  fixed?: boolean;
  className?: string;
  containerClassName?: string;
  showLabels?: boolean;
}

export const BottomNav: FC<BottomNavProps> = ({
  items,
  activeId,
  onChange,
  activeColor = '#D12026',
  inactiveColor = '#64748B',
  fixed = true,
  className = '',
  containerClassName = '',
  showLabels = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const getIsActive = (item: BottomNavItem): boolean => {
    if (activeId !== undefined) {
      return activeId === item.id;
    }
    if (item.path) {
      if (item.path === '/') {
        return location.pathname === '/';
      }
      return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    }
    return false;
  };

  const handleItemClick = (item: BottomNavItem) => {
    if (item.disabled) return;

    if (item.onClick) {
      item.onClick(item);
    }

    if (onChange) {
      onChange(item.id, item);
    }

    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const renderIcon = (item: BottomNavItem, isActive: boolean) => {
    const IconSource = isActive && item.activeIcon ? item.activeIcon : item.icon;

    if (!IconSource) return null;

    if (typeof IconSource === 'function' || (typeof IconSource === 'object' && 'render' in (IconSource as any))) {
      const IconComponent = IconSource as ComponentType<{
        className?: string;
        size?: number;
        fill?: string;
        strokeWidth?: number;
      }>;

      return (
        <IconComponent
          size={22}
          strokeWidth={isActive ? 2.3 : 1.8}
          className={`transition-all duration-200 ${
            isActive ? 'scale-105' : 'group-hover:scale-105'
          }`}
          fill={isActive && item.id === 'home' ? activeColor : 'none'}
        />
      );
    }

    return <span className='flex items-center justify-center'>{IconSource as ReactNode}</span>;
  };

  return (
    <nav
      aria-label='Bottom Navigation'
      className={`
        w-full z-40 select-none
        ${fixed ? 'fixed bottom-0 left-0 right-0' : 'relative'}
        ${className}
      `}
    >
      <div
        className={`
          mx-auto w-full max-w-lg bg-white/95 backdrop-blur-md
          border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]
          pb-safe pt-2.5 pb-2.5 px-3
          transition-all duration-300
          ${containerClassName}
        `}
      >
        <ul className='flex items-center justify-around gap-1 p-0 m-0 list-none'>
          {items.map((item) => {
            const isActive = getIsActive(item);

            return (
              <li key={item.id} className='flex-1 flex justify-center'>
                <button
                  type='button'
                  id={`bottom-nav-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    color: isActive ? activeColor : inactiveColor,
                  }}
                  className={`
                    group relative flex flex-col items-center justify-center
                    w-full py-1 px-1 rounded-xl
                    transition-all duration-200 cursor-pointer
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D12026]/40
                    ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
                  `}
                >
                  <div className='relative flex items-center justify-center'>
                    {renderIcon(item, isActive)}

                    {item.badge !== undefined && item.badge !== null && item.badge !== '' && (
                      <span
                        style={{ backgroundColor: item.badgeColor || activeColor }}
                        className='absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-extrabold text-white flex items-center justify-center shadow-xs ring-1 ring-white'
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {showLabels && (
                    <span
                      className={`
                        mt-1 text-[11px] leading-tight tracking-tight transition-all duration-200 text-center
                        ${isActive ? 'font-bold' : 'font-medium opacity-90 group-hover:opacity-100'}
                      `}
                    >
                      {item.label}
                    </span>
                  )}

                  {isActive && (
                    <span
                      aria-hidden='true'
                      style={{ backgroundColor: activeColor }}
                      className='absolute -bottom-1 w-1 h-1 rounded-full animate-pulse'
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

export default BottomNav;
