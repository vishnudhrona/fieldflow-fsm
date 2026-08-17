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
    <header
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs ${className}`}
    >
      <Link to='/' className='flex items-center gap-2 select-none'>
        <svg className='w-8 h-8' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <rect width='100' height='100' rx='24' fill='#D12026' />
          <path
            d='M25 35 L41 65 L50 48 L59 65 L75 35'
            stroke='white'
            strokeWidth='12'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
          <path
            d='M35 50 L50 25 L65 50'
            stroke='white'
            strokeWidth='12'
            strokeLinecap='round'
            strokeLinejoin='round'
            opacity='0.9'
          />
        </svg>
        <div className='flex flex-col leading-tight'>
          <span className='text-sm font-black tracking-tight text-slate-900'>Technician Tool</span>

          <span className='text-[10px] font-bold text-[#D12026] uppercase tracking-wider'>
            {getRoleLabel(user?.role)}
          </span>
        </div>
      </Link>

      <div className='flex items-center gap-2'>
        <NetworkSimulator />
      </div>
    </header>
  );
};

export default MobileNav;
