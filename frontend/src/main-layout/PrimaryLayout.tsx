import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileNav } from '../components/navigation';

export const PrimaryLayout: FC = () => {
  return (
    <div>
      <div className='block md:hidden sticky top-0 z-30'>
        <MobileNav />
      </div>

      <div className='p-4 sm:p-6 space-y-6 pb-24 md:pb-8'>
        <Outlet />
      </div>
    </div>
  );
};

export default PrimaryLayout;
