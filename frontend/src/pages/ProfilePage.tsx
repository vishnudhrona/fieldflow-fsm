import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  HardDrive,
  Wifi,
  WifiOff,
  LogOut,
  Layers,
  ClipboardList,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { useSync } from '../context/SyncContext';
import { useStorageQuota } from '../hooks';
import { getRoleLabel, UserRole } from '../services/authService';
import { getWorkOrders, type WorkOrder } from '../services/workOrderService';
import { Button } from '../components/ui';
import { SubpageHeader } from '../components/navigation';

export const ProfilePage: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = useNetwork();
  const { totalPending, isSyncing, syncNow } = useSync();
  const storage = useStorageQuota();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const isTechnician = user?.role === UserRole.TECHNICIAN;
  const roleLabel = getRoleLabel(user?.role);
  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const orders = await getWorkOrders();
        setWorkOrders(orders);
      } catch (err) {
        console.error('Failed to load work orders for profile stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Compute role-based statistics
  const stats = useMemo(() => {
    const relevantOrders = isTechnician && user?.id
      ? workOrders.filter(
          (o) =>
            o.technicianId === user.id ||
            (o.technician?.email && o.technician.email.toLowerCase() === user.email.toLowerCase())
        )
      : workOrders;

    const assigned = relevantOrders.filter(
      (o) => o.status === 'NEW' || o.status === 'PENDING' || o.status === 'IN_PROGRESS'
    ).length;
    const inProgress = relevantOrders.filter((o) => o.status === 'IN_PROGRESS').length;
    const completed = relevantOrders.filter((o) => o.status === 'COMPLETED').length;

    return {
      assigned,
      inProgress,
      completed,
      total: relevantOrders.length,
    };
  }, [workOrders, isTechnician, user]);

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to log out of your session?');
    if (confirmed) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-slate-50/60 pb-20 md:pb-12'>
      <SubpageHeader
        title='My Profile'
        backPath='/'
        className='block md:hidden sticky top-0 z-30 shadow-2xs'
      />

      <div className='w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6'>
        {/* Desktop Header */}
        <div className='hidden md:flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-black text-slate-900 tracking-tight'>User Profile & Settings</h1>
            <p className='text-xs text-slate-500 mt-0.5'>Manage your account credentials, role permissions, and offline device health</p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleLogout}
            leftIcon={<LogOut className='w-4 h-4 text-rose-600' />}
            className='border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs rounded-xl shadow-xs'
          >
            Log Out
          </Button>
        </div>

        {/* Top Hero Banner */}
        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl'>
          <div className='absolute -right-10 -bottom-10 w-48 h-48 bg-rose-600/10 rounded-full blur-2xl pointer-events-none' />
          
          <div className='relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left'>
            {/* Avatar Initials */}
            <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#D12026] to-[#911519] border-2 border-white/20 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg shrink-0'>
              {initial}
            </div>

            <div className='space-y-1.5 flex-1 min-w-0'>
              <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs text-rose-200 border border-white/10'>
                <Shield className='w-3.5 h-3.5 text-amber-300' />
                <span>{roleLabel}</span>
              </div>
              <h2 className='text-2xl sm:text-3xl font-black tracking-tight text-white truncate'>
                {user?.name || 'User Profile'}
              </h2>
              <p className='text-xs sm:text-sm text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-mono truncate'>
                <Mail className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                {user?.email || 'N/A'}
              </p>
            </div>

            {/* Quick Status Indicator */}
            <div className='sm:self-center px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-right hidden lg:block'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Connection Status</span>
              <span className='inline-flex items-center gap-1.5 text-xs font-bold mt-0.5 text-emerald-400'>
                {isOnline ? (
                  <>
                    <Wifi className='w-3.5 h-3.5' /> Cloud Connected
                  </>
                ) : (
                  <>
                    <WifiOff className='w-3.5 h-3.5 text-amber-400' /> Offline Mode
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          
          {/* Left Column: Account Details */}
          <div className='space-y-6 md:col-span-1'>
            {/* Account Information Card */}
            <div className='bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4'>
              <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                <User className='w-3.5 h-3.5 text-[#D12026]' /> Account Details
              </h3>

              <div className='space-y-3.5 text-xs'>
                <div>
                  <span className='text-slate-400 block text-[11px] font-medium'>Full Name</span>
                  <span className='font-bold text-slate-900 text-sm'>{user?.name || '—'}</span>
                </div>

                <div className='border-t border-slate-100 pt-2.5'>
                  <span className='text-slate-400 block text-[11px] font-medium'>Email Address</span>
                  <span className='font-bold text-slate-900 break-all'>{user?.email || '—'}</span>
                </div>

                <div className='border-t border-slate-100 pt-2.5'>
                  <span className='text-slate-400 block text-[11px] font-medium'>System Role</span>
                  <span className='font-bold text-slate-900'>{roleLabel}</span>
                </div>

                <div className='border-t border-slate-100 pt-2.5'>
                  <span className='text-slate-400 block text-[11px] font-medium'>Account Identifier</span>
                  <span className='font-mono text-[10px] text-slate-600 font-bold block truncate'>{user?.id || 'LOCAL-USER'}</span>
                </div>
              </div>
            </div>

            {/* Mobile Log Out Action */}
            <div className='block md:hidden'>
              <Button
                fullWidth
                variant='outline'
                size='lg'
                onClick={handleLogout}
                leftIcon={<LogOut className='w-4.5 h-4.5 text-rose-600' />}
                className='border-rose-200 text-rose-700 bg-white hover:bg-rose-50 font-bold text-sm rounded-2xl py-3.5 shadow-xs'
              >
                Log Out of Account
              </Button>
            </div>
          </div>

          {/* Right Column: Work Order Stats & System Diagnostics */}
          <div className='space-y-6 md:col-span-2'>
            
            {/* Operational Overview Metrics */}
            <div className='bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                  <ClipboardList className='w-3.5 h-3.5 text-[#D12026]' />
                  {isTechnician ? 'My Field Activity' : 'Company Field Operations'}
                </h3>
                <span className='text-[11px] text-slate-400 font-semibold'>Lifetime: {stats.total} jobs</span>
              </div>

              <div className='grid grid-cols-3 gap-3'>
                <div className='p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center'>
                  <div className='w-7 h-7 rounded-xl bg-white text-amber-600 flex items-center justify-center mx-auto shadow-2xs mb-1.5'>
                    <ClipboardList className='w-3.5 h-3.5' />
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-slate-900 block leading-none'>
                    {isLoadingStats ? '—' : stats.assigned}
                  </span>
                  <span className='text-[10px] sm:text-xs font-bold text-slate-600 mt-1 block'>
                    Active Jobs
                  </span>
                </div>

                <div className='p-3.5 sm:p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center'>
                  <div className='w-7 h-7 rounded-xl bg-white text-blue-600 flex items-center justify-center mx-auto shadow-2xs mb-1.5'>
                    <Clock className='w-3.5 h-3.5' />
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-slate-900 block leading-none'>
                    {isLoadingStats ? '—' : stats.inProgress}
                  </span>
                  <span className='text-[10px] sm:text-xs font-bold text-slate-600 mt-1 block'>
                    In Progress
                  </span>
                </div>

                <div className='p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-center'>
                  <div className='w-7 h-7 rounded-xl bg-white text-emerald-600 flex items-center justify-center mx-auto shadow-2xs mb-1.5'>
                    <CheckCircle2 className='w-3.5 h-3.5' />
                  </div>
                  <span className='text-xl sm:text-2xl font-black text-slate-900 block leading-none'>
                    {isLoadingStats ? '—' : stats.completed}
                  </span>
                  <span className='text-[10px] sm:text-xs font-bold text-slate-600 mt-1 block'>
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Offline Engine & Device Storage Health */}
            <div className='bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4'>
              <h3 className='text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                <HardDrive className='w-3.5 h-3.5 text-[#D12026]' /> IndexedDB & Offline Engine
              </h3>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {/* Outbox Queue Health */}
                <div className='p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                      <Layers className='w-4 h-4 text-slate-500' /> Outbox Sync Queue
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        totalPending > 0
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {totalPending > 0 ? `${totalPending} Queued` : 'All Synced'}
                    </span>
                  </div>
                  <p className='text-[11px] text-slate-500 leading-relaxed'>
                    Pending offline job notes, readings, checklist tasks, and photos.
                  </p>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={!isOnline || isSyncing || totalPending === 0}
                    onClick={() => syncNow()}
                    leftIcon={<RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />}
                    className='w-full text-xs font-bold mt-1 bg-white border-slate-200 hover:bg-slate-100 rounded-xl'
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Outbox Now'}
                  </Button>
                </div>

                {/* Storage Quota Health */}
                <div className='p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                      <HardDrive className='w-4 h-4 text-slate-500' /> IndexedDB Cache
                    </span>
                    <span className='text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-700'>
                      {storage.percentUsed ? `${Math.round(storage.percentUsed)}%` : 'Active'}
                    </span>
                  </div>
                  <p className='text-[11px] text-slate-500'>
                    Used: <strong className='text-slate-800'>{storage.usageFormatted || '0 MB'}</strong> of {storage.quotaFormatted || 'Quota'}
                  </p>
                  <div className='w-full bg-slate-200 h-1.5 rounded-full overflow-hidden'>
                    <div
                      className='bg-[#D12026] h-full rounded-full transition-all duration-300'
                      style={{ width: `${Math.min(100, Math.max(2, storage.percentUsed || 2))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
