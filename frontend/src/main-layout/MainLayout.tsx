import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

export const MainLayout: FC = () => {
  return (
    <div className='app-layout'>
      <main className='main-content '>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
