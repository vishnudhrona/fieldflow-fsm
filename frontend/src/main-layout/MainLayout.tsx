import { useState, useEffect, type FC } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav, DesktopNav, Sidebar, type BottomNavItem } from '../components/navigation';
import { menuService } from '../services/menuService';
import { useAuth } from '../context/AuthContext';

export const MainLayout: FC = () => {
  const { user } = useAuth();
  const [navItems, setNavItems] = useState<BottomNavItem[]>([]);

  const loadRoleMenus = async () => {
    try {
      const dynamicMenus = await menuService.getMenus();
      if (dynamicMenus.length > 0) {
        setNavItems(dynamicMenus);
      }
    } catch (err) {
      console.error('Failed to load dynamic role menus from database:', err);
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
