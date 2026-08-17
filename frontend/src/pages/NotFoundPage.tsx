import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export const NotFoundPage: FC = () => {
  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center text-center px-4 py-8 select-none'>
      <div className='w-full max-w-md bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl flex flex-col items-center z-10 transition-all duration-300 hover:shadow-2xl'>
        <div className='w-20 h-20 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-6 relative animate-bounce'>
          <span className='absolute inset-0 rounded-full bg-rose-400/20 animate-ping' />
          <AlertCircle className='w-10 h-10 text-[#D12026]' />
        </div>

        <h1 className='text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D12026] to-rose-500 leading-none mb-4 tracking-tighter'>
          404
        </h1>

        <h2 className='text-lg font-extrabold text-slate-800 mb-2 uppercase tracking-wide'>
          Page Not Found
        </h2>
        
        <p className='text-sm text-slate-500 max-w-xs mb-8 leading-relaxed font-medium'>
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        <Link 
          to="/" 
          className='inline-flex items-center justify-center gap-2 rounded-xl py-3 px-6 text-sm font-extrabold text-white tracking-widest bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] w-full transition-all duration-200 shadow-md border-0 uppercase hover:scale-[1.02] active:scale-[0.98]'
        >
          <Home className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
