import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  Users, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  MapPin, 
  AlertCircle, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';

export const HomePage: FC = () => {
  const { user } = useAuth();

  const stats = [
    { label: 'Assigned Orders', value: '4', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'In Progress', value: '2', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Completed Today', value: '5', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  const recentOrders = [
    {
      id: 'WO-1042',
      customer: 'Apex Logistics Hub',
      address: '742 Evergreen Terrace, Sector 4',
      status: 'In Progress',
      statusColor: 'bg-amber-100 text-amber-700 border-amber-200',
      priority: 'High Priority',
      time: '11:30 AM',
    },
    {
      id: 'WO-1043',
      customer: 'Starlight Medical Center',
      address: '108 Broadway Ave, Block B',
      status: 'Pending',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-200',
      priority: 'Normal',
      time: '02:00 PM',
    },
    {
      id: 'WO-1039',
      customer: 'GreenValley Residence',
      address: '22 Elm Street, Apt 4C',
      status: 'Completed',
      statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      priority: 'Low',
      time: '09:15 AM',
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Welcome Banner Card */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D12026] via-[#B11A1F] to-[#871115] p-6 text-white shadow-lg'>
        <div className='absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none' />
        <div className='relative z-10'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3'>
            <Sparkles className='w-3.5 h-3.5 text-amber-300' />
            <span>Field Dispatch Active</span>
          </div>
          <h1 className='text-2xl font-black tracking-tight'>
            Hello, {user?.name || 'Technician'}! 👋
          </h1>
          <p className='text-xs text-rose-100/90 mt-1 max-w-xs leading-relaxed'>
            You have <span className='font-bold text-white'>4 work orders</span> scheduled for today. Keep up the great work!
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div>
        <div className='flex items-center justify-between mb-3 px-1'>
          <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5'>
            <TrendingUp className='w-4 h-4 text-[#D12026]' />
            Today's Overview
          </h2>
        </div>
        <div className='grid grid-cols-3 gap-2.5'>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border ${stat.border} ${stat.bg} p-3.5 flex flex-col items-center text-center shadow-xs`}
              >
                <div className='p-2 rounded-xl bg-white shadow-xs mb-1.5'>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className='text-lg font-black text-slate-800 leading-none'>{stat.value}</span>
                <span className='text-[10px] font-semibold text-slate-600 mt-1 leading-tight'>
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Work Orders */}
      <div>
        <div className='flex items-center justify-between mb-3 px-1'>
          <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5'>
            <ClipboardList className='w-4 h-4 text-[#D12026]' />
            Active Work Orders
          </h2>
          <Link
            to='/work-orders'
            className='text-xs font-bold text-[#D12026] hover:underline inline-flex items-center gap-0.5'
          >
            View all
            <ChevronRight className='w-3.5 h-3.5' />
          </Link>
        </div>

        <div className='space-y-3'>
          {recentOrders.map((order) => (
            <div
              key={order.id}
              className='bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow'
            >
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div>
                  <span className='text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md'>
                    {order.id}
                  </span>
                  <h3 className='font-bold text-slate-900 text-sm mt-1'>{order.customer}</h3>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${order.statusColor}`}
                >
                  {order.status}
                </span>
              </div>

              <div className='flex items-center gap-1.5 text-slate-600 text-xs mt-2'>
                <MapPin className='w-3.5 h-3.5 text-slate-500 shrink-0' />
                <span className='truncate'>{order.address}</span>
              </div>

              <div className='flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2.5 text-[11px] text-slate-600 font-medium'>
                <span className='inline-flex items-center gap-1 text-rose-600 font-semibold'>
                  <AlertCircle className='w-3 h-3' />
                  {order.priority}
                </span>
                <span className='inline-flex items-center gap-1'>
                  <Clock className='w-3 h-3 text-slate-500' />
                  {order.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className='grid grid-cols-2 gap-3'>
        <Link
          to='/customers'
          className='bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:border-[#D12026]/40 transition-colors flex items-center gap-3'
        >
          <div className='w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D12026]'>
            <Users className='w-5 h-5' />
          </div>
          <div>
            <h4 className='text-xs font-bold text-slate-800'>Customers</h4>
            <p className='text-[10px] text-slate-600'>View contact directory</p>
          </div>
        </Link>

        <Link
          to='/work-orders'
          className='bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:border-[#D12026]/40 transition-colors flex items-center gap-3'
        >
          <div className='w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600'>
            <ClipboardList className='w-5 h-5' />
          </div>
          <div>
            <h4 className='text-xs font-bold text-slate-800'>Work Orders</h4>
            <p className='text-[10px] text-slate-600'>Manage daily jobs</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
