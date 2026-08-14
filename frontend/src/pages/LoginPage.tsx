import { useState, type FC } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { type LoginCredentials, UserRole } from '../services/authService';

export const LoginPage: FC = () => {
  const { register, handleSubmit } = useForm<LoginCredentials>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const user = await login(data);
      if (user?.role === UserRole.ADMIN_DISPATCHER) {
        navigate('/');
      } else {
        navigate('/guide');
      }
    } catch (err: any) {
      setApiMessage(err?.response?.data?.message || err?.message || 'Failed to authenticate with backend');
    }
  };

  return (
    <div className='w-full max-w-sm bg-white border border-slate-200 px-5 py-8 rounded-[2rem] shadow-lg z-10'>
      {apiMessage && (
        <div className='mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600'>{apiMessage}</div>
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

        <div className='pt-4'>
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
