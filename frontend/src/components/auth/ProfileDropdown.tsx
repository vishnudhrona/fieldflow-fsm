import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel } from '../../services/authService';
import { Button } from '../ui';

export interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDropdown: FC<ProfileDropdownProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const handleLogoutClick = () => {
    logout();
    onClose();
  };

  const displayName = user?.name;
  const displayEmail = user?.email;
  const displayRole = getRoleLabel(user?.role);

  return (
    <div
      role='menu'
      aria-orientation='vertical'
      className='absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-1.5 z-50
        animate-in fade-in slide-in-from-top-2 duration-150 select-none'
    >
      <div className='px-4 py-2.5 border-b border-slate-100'>
        <p className='text-xs font-bold text-slate-900 truncate'>{displayName}</p>
        <p className='text-[11px] text-slate-500 truncate mt-0.5'>{displayEmail}</p>
        <span className='inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-50 text-[#D12026] border border-rose-200'>
          {displayRole}
        </span>
      </div>

      <div className='p-1 border-b border-slate-100'>
        <Link
          to='/profile'
          onClick={onClose}
          className='flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors'
        >
          <User className='w-4 h-4 text-slate-400' />
          <span>My Profile & Settings</span>
        </Link>
      </div>

      <div className='pt-1'>
        <Button
          fullWidth
          variant='ghost'
          size='sm'
          role='menuitem'
          onClick={handleLogoutClick}
          leftIcon={<LogOut className='w-4 h-4' />}
          className='justify-start px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 rounded-none border-0 text-left cursor-pointer'
        >
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
