import { Outlet } from 'react-router-dom';
import LoginHeader from '../components/LoginHeader';
import NetworkSimulator from '../components/NetworkSimulator';

const LoginLayout = () => {
  return (
    <main className='min-h-screen bg-white sm:bg-slate-100 flex justify-center items-center p-0 sm:p-6 w-full'>
      <div className='w-full min-h-screen sm:min-h-0 sm:max-w-md bg-white sm:rounded-[2rem] sm:border sm:border-slate-200 sm:shadow-xl flex flex-col justify-center items-center px-6 py-8'>
        <NetworkSimulator mode="badge" />
        <LoginHeader />
        <Outlet />
      </div>
    </main>
  );
};

export default LoginLayout;
