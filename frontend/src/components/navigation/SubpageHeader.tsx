import { useState, useRef, type FC, type ReactNode, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Button } from '../ui';
import { useClickOutside } from '../../hooks';

export interface HeaderActionItem {
  id?: string;
  label: string | ReactNode;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface SubpageHeaderProps {
  title?: string;
  onBack?: () => void;
  backPath?: string;
  rightAction?: ReactNode;
  actionItems?: HeaderActionItem[];
  className?: string;
}

export const SubpageHeader: FC<SubpageHeaderProps> = ({
  title,
  onBack,
  backPath,
  rightAction,
  actionItems,
  className = '',
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsMenuOpen(false), isMenuOpen);

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
        'block md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3.5 flex items-center justify-between
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

      <div className='w-9 flex justify-end shrink-0 relative'>
        {rightAction ? (
          rightAction
        ) : actionItems && actionItems.length > 0 ? (
          <div ref={menuRef} className='relative'>
            <Button
              variant='ghost'
              size='sm'
              aria-label='More options'
              onClick={() => setIsMenuOpen((prev) => !prev)}
              leftIcon={<MoreVertical className='w-4 h-4' />}
              className='w-8 h-8 p-0 rounded-full text-slate-600 hover:bg-slate-100 active:scale-95 transition-colors border-0 shadow-none flex items-center justify-center'
            />

            {isMenuOpen && (
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100'>
                {actionItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id ?? idx}
                      variant='ghost'
                      size='sm'
                      fullWidth
                      disabled={item.disabled}
                      onClick={() => {
                        setIsMenuOpen(false);
                        item.onClick?.();
                      }}
                      leftIcon={Icon ? <Icon className='w-3.5 h-3.5 shrink-0' /> : undefined}
                      className={`justify-start px-3.5 py-2 text-xs font-semibold rounded-none border-0 text-left ${
                        item.danger
                          ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#D12026]'
                      }`}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default SubpageHeader;
