import { useState, useRef, type FC } from 'react';
import { Database, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStorageQuota, useClickOutside } from '../../hooks';
import { getRoleLabel } from '../../services/authService';
import { ProfileDropdown } from '../auth';
import NetworkSimulator from '../NetworkSimulator';

export interface DesktopNavProps {
  storageUsageText?: string;
}

export const DesktopNav: FC<DesktopNavProps> = ({ storageUsageText }) => {
  const { user } = useAuth();
  const storage = useStorageQuota();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(profileDropdownRef, () => setIsProfileOpen(false), isProfileOpen);

  const displayStorage =
    storageUsageText ||
    (storage.quota > 0
      ? `${Math.round(storage.percentUsed || 72)}% of ${storage.quotaFormatted || '2GB'} used`
      : '72% of 2GB used');

  const displayName = user?.name;
  const displayRole = getRoleLabel(user?.role);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className='flex justify-end w-full sticky top-0 z-30 bg-white backdrop-blur-md border-b border-slate-200
        px-4 lg:px-6 py-2.5 gap-4
        shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
    >

      <div className='flex items-center gap-2.5 lg:gap-3.5 shrink-0'>
        <NetworkSimulator />

        <div className='hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs'>
          <Database className='w-3.5 h-3.5 text-slate-500' />
          <span>{displayStorage}</span>
        </div>

        <div className='h-6 w-px bg-slate-200' />

        <div className='relative' ref={profileDropdownRef}>
          <button
            type='button'
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-label='User menu'
            className='flex items-center gap-2.5 p-1 sm:px-2 py-1 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer'
          >
            <div className='w-8 h-8 rounded-full bg-rose-100 border border-rose-200 text-rose-700 font-black text-xs flex items-center justify-center shadow-xs'>
              {initial}
            </div>

            <div className='hidden sm:flex flex-col text-left leading-tight'>
              <span className='text-xs font-bold text-slate-900'>{displayName}</span>
              <span className='text-[10px] text-slate-400 font-medium'>{displayRole}</span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
      </div>
    </header>
  );
};

export default DesktopNav;
