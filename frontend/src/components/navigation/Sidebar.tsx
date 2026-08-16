import { useMemo, type FC, type ReactNode, type ComponentType } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { BottomNavItem } from './BottomNav';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string; size?: number; fill?: string; strokeWidth?: number }> | ReactNode;
  path?: string;
  badge?: string | number;
  badgeColor?: string;
}

export interface SidebarSection {
  title?: string;
  items: SidebarNavItem[];
}

export interface SidebarProps {
  sections?: SidebarSection[];
  navItems?: BottomNavItem[];
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  brandTitle?: string;
  brandSubtitle?: string;
}

export const Sidebar: FC<SidebarProps> = ({
  sections = [],
  navItems,
  isCollapsed = false,
  onCloseMobile,
  brandTitle = 'Technicians',
  brandSubtitle = 'Service Tool',
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const displaySections: SidebarSection[] = useMemo(() => {
    if (navItems && navItems.length > 0) {
      return [
        {
          items: navItems,
        },
      ];
    }
    return sections;
  }, [sections, navItems]);

  const isItemActive = (path?: string): boolean => {
    if (!path) return false;
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderIcon = (item: SidebarNavItem, active: boolean) => {
    const IconSource = item.icon;
    if (!IconSource) return null;

    if (
      typeof IconSource === 'function' ||
      (typeof IconSource === 'object' && IconSource !== null && 'render' in (IconSource as any))
    ) {
      const IconComponent = IconSource as ComponentType<{
        className?: string;
        size?: number;
        fill?: string;
        strokeWidth?: number;
      }>;
      return (
        <IconComponent
          size={19}
          className={`shrink-0 transition-colors ${
            active ? 'text-[#D12026]' : 'text-slate-500 group-hover:text-slate-700'
          }`}
        />
      );
    }

    return <span className='shrink-0 flex items-center justify-center'>{IconSource as ReactNode}</span>;
  };

  const sidebarContent = (
    <div className='flex flex-col h-full overflow-y-auto px-8 py-5 select-none'>
      <div className='flex items-center justify-between px-2 mb-6'>
        <Link to='/' onClick={onCloseMobile} className='flex items-center gap-3 group focus:outline-none'>
          <div className='w-9 h-9 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#D12026] flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105'>
            <svg className='w-5 h-5 fill-white' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                d='M5 19L11 5L15 13L19 5'
                stroke='white'
                strokeWidth='3.5'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <div className='flex flex-col items-center leading-none'>
            <span className='text-md font-black tracking-tight text-[#D12026]'>{brandTitle}</span>
            <span className='text-sm font-semibold text-slate-400 ml-1.5'>{brandSubtitle}</span>
          </div>
        </Link>
      </div>

      <nav className='flex-1 space-y-5'>
        {displaySections.map((section, idx) => (
          <div key={section.title || `section-${idx}`} className='space-y-1'>
            {section.title && !isCollapsed && (
              <h3 className='text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-3 mb-1.5'>
                {section.title}
              </h3>
            )}

            <ul className='space-y-1 p-0 m-0 list-none'>
              {section.items.map((item) => {
                const active = isItemActive(item.path);

                return (
                  <li key={item.id}>
                    <button
                      type='button'
                      onClick={() => handleNavClick(item.path)}
                      title={isCollapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold
                        transition-all duration-150 cursor-pointer text-left
                        ${
                          active
                            ? 'bg-rose-50/80 text-[#D12026] font-bold shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                        }
                        ${isCollapsed ? 'justify-center px-2' : ''}
                      `}
                    >
                      {renderIcon(item, active)}

                      {!isCollapsed && <span className='flex-1 truncate tracking-tight'>{item.label}</span>}

                      {!isCollapsed && item.badge !== undefined && (
                        <span className='px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-[#D12026]'>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside
        className='hidden md:flex flex-col bg-white border-r border-slate-200/90
          transition-all duration-300 h-screen sticky top-0 shrink-0'
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
