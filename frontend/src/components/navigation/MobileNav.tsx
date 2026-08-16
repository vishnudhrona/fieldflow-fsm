import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NetworkSimulator } from '../NetworkSimulator';
import { getRoleLabel } from '../../services/authService';

export interface MobileNavProps {
  className?: string;
}

export const MobileNav: FC<MobileNavProps> = ({ className = '' }) => {
  const { user } = useAuth();

  return (
    <header className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs ${className}`}>
      <Link to='/' className='flex items-center gap-2 select-none'>
        <div className='w-8 h-8 rounded-xl bg-[#D12026] flex items-center justify-center text-white font-black text-sm shadow-xs'>
          FF
        </div>
        <div className='flex flex-col leading-tight'>
          <span className='text-sm font-black tracking-tight text-slate-900'>FieldFlow</span>
          <span className='text-[10px] font-bold text-[#D12026] uppercase tracking-wider'>
            {getRoleLabel(user?.role)}
          </span>
        </div>
      </Link>

      <div className='flex items-center gap-2'>
        <NetworkSimulator mode='badge' />
      </div>
    </header>
  );
};

export default MobileNav;
