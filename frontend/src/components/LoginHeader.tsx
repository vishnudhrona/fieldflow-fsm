import type { FC } from 'react';

export const LoginHeader: FC = () => {
  return (
    <>
      <div className='flex items-center gap-2 mb-4 z-10 select-none'>
        <svg className='w-8 h-8' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <rect width='100' height='100' rx='24' fill='#D12026' />
          <path
            d='M25 35 L41 65 L50 48 L59 65 L75 35'
            stroke='white'
            stroke-width='12'
            stroke-linecap='round'
            stroke-linejoin='round'
          />
          <path
            d='M35 50 L50 25 L65 50'
            stroke='white'
            stroke-width='12'
            stroke-linecap='round'
            stroke-linejoin='round'
            opacity='0.9'
          />
        </svg>
        <div className='flex flex-col leading-none'>
          <span className='text-xl font-black tracking-tight text-[#D12026]'>TECHNICIANS</span>
          <span className='text-[10px] font-bold text-slate-500 self-end tracking-wider'>Service Tool</span>
        </div>
      </div>

      <div className='w-28 h-28 rounded-full overflow-hidden mb-4 flex items-center justify-center bg-white shadow-md border border-slate-100 p-1 z-10'>
        <img src='/technician.png' alt='Technician Illustration' className='w-full h-full object-contain' />
      </div>

      <div className='text-left w-full max-w-sm mb-4 px-1 z-10'>
        <p className='text-sm font-semibold text-slate-500'>Welcome to</p>
        <h2 className='text-xl font-black text-[#D12026] leading-tight'>Field Service App</h2>
      </div>
    </>
  );
};

export default LoginHeader;
