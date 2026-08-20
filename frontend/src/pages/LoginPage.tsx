import { useState, type FC } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Shield, Wrench } from 'lucide-react';
import { Input, Button } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { type LoginCredentials } from '../services/authService';

export const LoginPage: FC = () => {
  const { register, handleSubmit, setValue } = useForm<LoginCredentials>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const fillAdminCredentials = () => {
    setValue('email', 'admin@example.com');
    setValue('password', 'admin123');
  };

  const fillTechCredentials = () => {
    setValue('email', 'tech@example.com');
    setValue('password', 'tech123');
  };

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
      navigate('/');
    } catch (err: any) {
      setApiMessage(err?.response?.data?.message || err?.message || 'Failed to authenticate with backend');
    }
  };

  return (
    <div className='w-full max-w-sm bg-white border border-slate-200 px-5 py-7 rounded-[2rem] shadow-lg z-10 space-y-4'>
      {/* Quick Demo Credentials Buttons */}
      <div className='bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2 text-center'>
        <span className='text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block'>
          Quick Demo Autofill
        </span>
        <div className='grid grid-cols-2 gap-2'>
          <button
            type='button'
            onClick={fillAdminCredentials}
            className='flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-bold text-xs shadow-2xs transition-all cursor-pointer'
          >
            <Shield className='w-3.5 h-3.5 text-[#D12026]' />
            <span>Admin</span>
          </button>

          <button
            type='button'
            onClick={fillTechCredentials}
            className='flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-bold text-xs shadow-2xs transition-all cursor-pointer'
          >
            <Wrench className='w-3.5 h-3.5 text-blue-600' />
            <span>Technician</span>
          </button>
        </div>
      </div>

      {apiMessage && (
        <div className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600'>{apiMessage}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
        <Input
          id='email'
          type='email'
          label='Email'
          placeholder='Enter your email'
          color='sky'
          className='w-full px-4 py-3 text-sm bg-slate-50 border-slate-250 text-slate-800 rounded-xl focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026]'
          {...register('email', { required: true })}
        />

        <div className='space-y-1'>
          <Input
            id='password'
            type='password'
            label='Password'
            placeholder='Enter your password'
            color='sky'
            className='w-full px-4 py-3 text-sm bg-slate-50 border-slate-250 text-slate-800 rounded-xl focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026]'
            {...register('password', { required: true })}
          />
        </div>

        <div className='pt-2'>
          <Button
            type='submit'
            fullWidth
            size='lg'
            variant='primary'
            className='rounded-xl py-3 text-sm font-extrabold text-white tracking-widest bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] w-full transition-colors shadow-md border-0'
          >
            LOGIN
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
