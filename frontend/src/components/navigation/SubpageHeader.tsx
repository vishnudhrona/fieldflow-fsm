import { type FC, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '../ui';

export interface SubpageHeaderProps {
  title?: string;
  onBack?: () => void;
  backPath?: string;
  rightAction?: ReactNode;
  className?: string;
}

export const SubpageHeader: FC<SubpageHeaderProps> = ({
  title,
  onBack,
  backPath,
  rightAction,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3.5 flex items-center justify-between
        shadow-xs select-none
        ${className}
      `}
    >
      <Button
        variant='ghost'
        size='sm'
        aria-label='Go back'
        onClick={handleBack}
        leftIcon={<ChevronLeft className='w-6 h-6' />}
        className='p-1.5 -ml-1.5 rounded-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition-all border-0 shadow-none min-w-0'
      />

      {title && (
        <h1 className='text-base font-bold text-slate-900 tracking-tight text-center flex-1 px-2 truncate'>
          {title}
        </h1>
      )}

      <div className='w-9 flex justify-end shrink-0'>
        {rightAction || null}
      </div>
    </header>
  );
};

export default SubpageHeader;
