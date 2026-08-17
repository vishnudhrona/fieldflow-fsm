import { useState, useEffect, type FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Home, Users, ClipboardList, User } from 'lucide-react';
import { BottomNav, DesktopNav, Sidebar, type BottomNavItem } from '../components/navigation';
import { menuService } from '../services/menuService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_NAV_ITEMS: BottomNavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
  { id: 'work-orders', label: 'Work Orders', icon: ClipboardList, path: '/work-orders' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export const MainLayout: FC = () => {
  const { user } = useAuth();
  const [navItems, setNavItems] = useState<BottomNavItem[]>(DEFAULT_NAV_ITEMS);

  const loadRoleMenus = async () => {
    try {
      const dynamicMenus = await menuService.getMenus();
      if (dynamicMenus && dynamicMenus.length > 0) {
        setNavItems(dynamicMenus);
      }
    } catch {
      setNavItems(DEFAULT_NAV_ITEMS);
    }
  };

  useEffect(() => {
    loadRoleMenus();
  }, [user]);

  return (
    <div className='min-h-screen bg-slate-50 flex flex-col md:flex-row w-full'>
      <Sidebar navItems={navItems} />
      <div className='flex-1 flex flex-col min-w-0 min-h-screen'>
        <div className='hidden md:block sticky top-0 z-30'>
          <DesktopNav />
        </div>

        <main className='flex-1 w-full mx-auto p-0 md:p-6 md:pb-8'>
          <Outlet />
        </main>
        <div className='block md:hidden'>
          <BottomNav items={navItems} activeColor='#D12026' inactiveColor='#64748B' fixed={true} />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
