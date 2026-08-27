import { forwardRef, type InputHTMLAttributes, type ChangeEvent } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string, e?: ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  isLoading?: boolean;
  containerClassName?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = 'Search...',
      isLoading = false,
      disabled = false,
      className = '',
      containerClassName = '',
      id = 'search-input',
      ...rest
    },
    ref
  ) => {
    return (
      <div className={cn('relative w-full', containerClassName)}>
        <div className='absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-slate-400'>
          {isLoading ? (
            <Loader2 className='w-4 h-4 animate-spin text-[#D12026]' />
          ) : (
            <Search className='w-4 h-4' />
          )}
        </div>

        <input
          ref={ref}
          id={id}
          type='text'
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value, e)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026] shadow-2xs transition-all',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-50',
            className
          )}
          {...rest}
        />

        {value && onClear && !disabled && (
          <button
            type='button'
            onClick={onClear}
            aria-label='Clear search'
            className='absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer'
          >
            <X className='w-3.5 h-3.5' />
          </button>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
