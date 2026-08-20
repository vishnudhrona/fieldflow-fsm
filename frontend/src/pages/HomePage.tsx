import { useState, useEffect, useMemo, type FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Loader2,
  Calendar,
  UserCheck,
  Building2,
  Eye,
  Edit,
} from 'lucide-react';
import { Table, EntityCard, EmptyState, StatusBadge, TableActionMenu, type Column } from '../components/ui';
import { getWorkOrders, type WorkOrder } from '../services/workOrderService';
import { WORK_ORDER_COLUMNS } from '../constants';
import { mapObjectValues } from '../utils';

export const HomePage: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isTechnician = user?.role === 'TECHNICIAN';

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const data = await getWorkOrders();
        setWorkOrders(data);
      } catch (err) {
        console.error('Failed to fetch home dashboard work orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const roleFilteredOrders = useMemo(() => {
    if (!isTechnician || !user?.id) {
      return workOrders;
    }
    return workOrders.filter(
      (order) =>
        order.technicianId === user.id ||
        (order.technician?.email && order.technician.email.toLowerCase() === user.email.toLowerCase())
    );
  }, [workOrders, isTechnician, user]);

  const activeOrders = useMemo(() => {
    return roleFilteredOrders.filter(
      (order) => order.status === 'NEW' || order.status === 'PENDING' || order.status === 'IN_PROGRESS'
    );
  }, [roleFilteredOrders]);

  const stats = useMemo(() => {
    const assignedCount = activeOrders.length;
    const inProgressCount = roleFilteredOrders.filter((o) => o.status === 'IN_PROGRESS').length;
    const completedCount = roleFilteredOrders.filter((o) => o.status === 'COMPLETED').length;

    return [
      {
        label: isTechnician ? 'My Active Jobs' : 'Active Orders',
        value: assignedCount,
        icon: ClipboardList,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
      },
      {
        label: 'In Progress',
        value: inProgressCount,
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      },
      {
        label: 'Completed',
        value: completedCount,
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
      },
    ];
  }, [activeOrders.length, roleFilteredOrders, isTechnician]);

  const dashboardColumns = useMemo<Column<WorkOrder>[]>(() => {
    const baseColumns = mapObjectValues(WORK_ORDER_COLUMNS, ['header']);

    return baseColumns.map((col: any) => {
      if (col.accessor === 'orderNumber') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <span className='font-bold text-slate-900 text-xs'>{order.orderNumber}</span>
          ),
        };
      }

      if (col.accessor === 'title') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <div className='min-w-0 max-w-xs'>
              <span className='font-semibold text-slate-800 text-xs block truncate'>{order.title}</span>
              {order.description && (
                <span className='text-[11px] text-slate-400 block truncate'>{order.description}</span>
              )}
            </div>
          ),
        };
      }

      if (col.accessor === 'customer') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <span className='text-xs font-medium text-slate-700 truncate block max-w-[140px]'>
              {order.customer?.name || 'N/A'}
            </span>
          ),
        };
      }

      if (col.accessor === 'asset') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <div className='flex items-center gap-2'>
              {order.asset?.imageUrl ? (
                <img
                  src={order.asset.imageUrl}
                  alt={order.asset.machineName}
                  className='w-7 h-7 rounded-lg object-contain border border-slate-200 shrink-0 p-0.5 bg-slate-50'
                />
              ) : (
                <div className='w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0'>
                  <Building2 className='w-3.5 h-3.5' />
                </div>
              )}
              <span className='font-medium text-slate-800 text-xs truncate max-w-[130px]'>
                {order.asset?.machineName || 'Equipment'}
              </span>
            </div>
          ),
        };
      }

      if (col.accessor === 'technician') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <div className='flex items-center gap-1.5'>
              <UserCheck className='w-3.5 h-3.5 text-[#D12026] shrink-0' />
              <span className='font-medium text-xs text-slate-800 truncate'>
                {order.technician?.name || 'Unassigned'}
              </span>
            </div>
          ),
        };
      }

      if (col.accessor === 'priority') {
        return {
          ...col,
          cell: (order: WorkOrder) => <StatusBadge status={order.priority} size='xs' rounded='full' />,
        };
      }

      if (col.accessor === 'scheduledDate') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <div className='text-xs text-slate-600 flex items-center gap-1.5'>
              <Calendar className='w-3.5 h-3.5 text-slate-400 shrink-0' />
              <span>
                {order.scheduledDate} {order.scheduledTime ? `(${order.scheduledTime})` : ''}
              </span>
            </div>
          ),
        };
      }

      if (col.accessor === 'status') {
        return {
          ...col,
          cell: (order: WorkOrder) => <StatusBadge status={order.status} size='xs' rounded='full' />,
        };
      }

      if (col.accessor === 'id') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <TableActionMenu
              row={order}
              actionItems={[
                {
                  id: 'view',
                  label: 'View Job Details',
                  icon: Eye,
                  onClick: (row) => navigate(`/work-orders/${row.id}`),
                },
                {
                  id: 'edit',
                  label: 'Edit Work Order',
                  icon: Edit,
                  onClick: (row) => navigate(`/work-orders/edit/${row.id}`),
                },
              ]}
            />
          ),
        };
      }

      return col;
    });
  }, [navigate]);

  return (
    <div className='space-y-6'>
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D12026] via-[#B11A1F] to-[#871115] p-6 text-white shadow-lg'>
        <div className='absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none' />
        <div className='relative z-10'>
          <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs mb-3'>
            <Sparkles className='w-3.5 h-3.5 text-amber-300' />
            <span>{isTechnician ? 'Field Technician Active' : 'Dispatcher Command Center'}</span>
          </div>
          <h1 className='text-2xl font-black tracking-tight'>
            Hello, {user?.name || 'Technician'}! 👋
          </h1>
          <p className='text-xs text-rose-100/90 mt-1 max-w-sm leading-relaxed'>
            {isTechnician ? (
              <>
                You have <span className='font-bold text-white'>{activeOrders.length} active jobs</span> assigned to your queue.
              </>
            ) : (
              <>
                There are <span className='font-bold text-white'>{activeOrders.length} active work orders</span> currently dispatched across teams.
              </>
            )}
          </p>
        </div>
      </div>

      <div>
        <div className='flex items-center justify-between mb-3 px-1'>
          <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5'>
            <TrendingUp className='w-4 h-4 text-[#D12026]' />
            Today's Overview
          </h2>
        </div>
        <div className='grid grid-cols-3 gap-2.5 sm:gap-4'>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-2xl border ${stat.border} ${stat.bg} p-3 sm:p-4 flex flex-col items-center text-center shadow-xs transition-transform hover:scale-[1.02]`}
              >
                <div className='p-2 rounded-xl bg-white shadow-xs mb-1.5'>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className='text-xl sm:text-2xl font-black text-slate-800 leading-none'>
                  {isLoading ? '—' : stat.value}
                </span>
                <span className='text-[10px] sm:text-xs font-semibold text-slate-600 mt-1 leading-tight'>
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex items-center justify-between px-1'>
          <div>
            <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5'>
              <ClipboardList className='w-4 h-4 text-[#D12026]' />
              Active Work Orders
            </h2>
            <p className='text-xs text-slate-500 hidden sm:block'>
              {isTechnician ? 'Jobs currently assigned to your shift' : 'All dispatched jobs in progress'}
            </p>
          </div>
          <Link
            to='/work-orders'
            className='text-xs font-bold text-[#D12026] hover:underline inline-flex items-center gap-0.5'
          >
            View all
            <ChevronRight className='w-3.5 h-3.5' />
          </Link>
        </div>

        {isLoading ? (
          <div className='bg-white rounded-2xl p-10 border border-slate-200 text-center flex flex-col items-center justify-center gap-2'>
            <Loader2 className='w-7 h-7 animate-spin text-[#D12026]' />
            <p className='text-xs font-semibold text-slate-500'>Loading your work orders...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className='bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs'>
            <EmptyState
              title='No active work orders'
              description={
                isTechnician
                  ? 'You are all caught up! No active jobs in your queue right now.'
                  : 'There are no active or pending work orders currently in the system.'
              }
              actionText={!isTechnician ? '+ Create Work Order' : undefined}
              onAction={!isTechnician ? () => navigate('/work-orders/add') : undefined}
            />
          </div>
        ) : (
          <>
            <div className='space-y-3 md:hidden'>
              {activeOrders.slice(0, 5).map((order) => (
                <EntityCard
                  key={order.id}
                  title={order.title}
                  subtitle={`${order.orderNumber} • ${order.customer?.name || 'Customer'}`}
                  image={order.asset?.imageUrl || undefined}
                  statusBadgeValue={order.status}
                  details={{
                    Priority: order.priority,
                    Technician: order.technician?.name || 'Unassigned',
                    Scheduled: `${order.scheduledDate}${order.scheduledTime ? ` (${order.scheduledTime})` : ''}`,
                  }}
                  onClick={() => navigate(`/work-orders/${order.id}`)}
                />
              ))}
            </div>

            <div className='hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden'>
              <Table<WorkOrder>
                columns={dashboardColumns}
                data={activeOrders.slice(0, 10)}
                keyExtractor={(order) => order.id}
                hoverable
              />
            </div>
          </>
        )}
      </div>

      <div className='grid grid-cols-2 gap-3 sm:gap-4'>
        <Link
          to='/customers'
          className='bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:border-[#D12026]/40 transition-colors flex items-center gap-3'
        >
          <div className='w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D12026] shrink-0'>
            <Users className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <h4 className='text-xs font-bold text-slate-800 truncate'>Customers</h4>
            <p className='text-[10px] text-slate-500 truncate'>View contact directory</p>
          </div>
        </Link>

        <Link
          to='/work-orders'
          className='bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs hover:border-[#D12026]/40 transition-colors flex items-center gap-3'
        >
          <div className='w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0'>
            <ClipboardList className='w-5 h-5' />
          </div>
          <div className='min-w-0'>
            <h4 className='text-xs font-bold text-slate-800 truncate'>Work Orders</h4>
            <p className='text-[10px] text-slate-500 truncate'>Manage daily jobs</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;

