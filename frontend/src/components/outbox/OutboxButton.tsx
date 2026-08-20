import { useState, type FC } from 'react';
import { RefreshCw, UploadCloud } from 'lucide-react';
import { Button } from '../ui';
import { useSync } from '../../context/SyncContext';
import { OutboxDrawer } from './OutboxDrawer';

export interface OutboxButtonProps {
  className?: string;
  variant?: 'navbar' | 'mobile-floating' | 'subtle';
}

export const OutboxButton: FC<OutboxButtonProps> = ({ className = '', variant = 'navbar' }) => {
  const { totalPending, isSyncing } = useSync();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type='button'
        variant={variant === 'mobile-floating' ? 'danger' : 'outline'}
        size='sm'
        onClick={() => setIsOpen(true)}
        title='Offline Outbox & Sync Queue'
        aria-label='Offline Outbox'
        leftIcon={
          isSyncing && (
            <RefreshCw
              className={`w-3.5 h-3.5 animate-spin ${
                variant === 'mobile-floating' ? 'text-white' : 'text-blue-600'
              }`}
            />
          )
        }
        className={`relative select-none font-bold text-xs transition-all ${
          variant === 'mobile-floating'
            ? '!p-3.5 !rounded-full shadow-xl !bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800 text-white !border-transparent'
            : totalPending > 0
            ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-100 hover:text-amber-900 hover:border-amber-400'
            : 'bg-white text-slate-700 border-slate-200 shadow-2xs hover:bg-slate-50 hover:text-slate-900'
        } ${className}`}
      >
        {variant !== 'mobile-floating' ? (
          <span className='hidden sm:inline'>Outbox</span>
        ) : (
          <UploadCloud className='w-4 h-4 text-white' />
        )}

        {totalPending > 0 && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              variant === 'mobile-floating'
                ? 'absolute -top-1.5 -right-1.5 shadow-md bg-amber-400 text-slate-900 border-2 border-white animate-pulse'
                : 'ml-0.5 bg-amber-500 text-white animate-pulse'
            }`}
          >
            {totalPending}
          </span>
        )}
      </Button>

      <OutboxDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default OutboxButton;
