import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav, DesktopNav, Sidebar } from '../components/navigation';
import { OutboxButton } from '../components/outbox';
import { useNavigationItems } from '../hooks';
import { Can } from '../components/auth';
import { UserRole } from '../services/authService';

export const MainLayout: FC = () => {
  const { navItems } = useNavigationItems();

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
        <Can roles={UserRole.TECHNICIAN}>
          <div className='block md:hidden fixed bottom-18 right-3.5 z-40'>
            <OutboxButton variant='mobile-floating' />
          </div>
        </Can>

        <div className='block md:hidden'>
          <BottomNav items={navItems} activeColor='#D12026' inactiveColor='#64748B' fixed={true} />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
