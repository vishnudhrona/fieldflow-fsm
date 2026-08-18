import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, Wrench, UserCheck, Calendar, Edit, Ban } from 'lucide-react';
import {
  getWorkOrders,
  updateWorkOrderStatus,
  type WorkOrder,
  type WorkOrderStatus,
} from '../services/workOrderService';
import { useDebounce } from '../hooks';
import { Can } from '../components/auth';
import { UserRole } from '../services/authService';
import { WORK_ORDER_COLUMNS } from '../constants';
import { mapObjectValues } from '../utils';
import {
  Button,
  SearchBar,
  Tabs,
  Table,
  EntityCard,
  EmptyState,
  StatusBadge,
  TableActionMenu,
  type Column,
  type TabItem,
} from '../components/ui';

const FILTER_TABS: TabItem<'ALL' | WorkOrderStatus>[] = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
];

export const WorkOrdersPage: FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getWorkOrders({
        search: debouncedSearchTerm,
        status: filter,
      });
      setWorkOrders(data);
    } catch {
      setWorkOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedSearchTerm, filter]);

  const handleCancelWorkOrder = async (order: WorkOrder) => {
    if (order.status === 'CANCELLED') return;
    const confirmCancel = window.confirm(`Are you sure you want to cancel work order ${order.orderNumber}?`);
    if (!confirmCancel) return;

    setWorkOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: 'CANCELLED' } : o)));

    try {
      await updateWorkOrderStatus(order.id, 'CANCELLED');
    } catch (err: any) {
      setWorkOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)));
      alert(err?.response?.data?.message || 'Failed to cancel work order. Please try again.');
    }
  };

  const columns = useMemo<Column<WorkOrder>[]>(() => {
    const dataColumns = mapObjectValues(WORK_ORDER_COLUMNS, ['header']);

    return dataColumns.map((col: { accessor: string; }) => {
      if (col.accessor === 'orderNumber') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <span className='font-mono font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md'>
              {order.orderNumber}
            </span>
          ),
        };
      }

      if (col.accessor === 'title') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <div className='max-w-xs'>
              <p className='font-bold text-slate-900 text-xs truncate'>{order.title}</p>
              {order.description && <p className='text-[11px] text-slate-500 truncate mt-0.5'>{order.description}</p>}
            </div>
          ),
        };
      }

      if (col.accessor === 'customer') {
        return {
          ...col,
          cell: (order: WorkOrder) => (
            <div>
              <p className='font-semibold text-slate-800 text-xs truncate'>{order.customer?.name || 'N/A'}</p>
              {order.customer?.phone && <p className='text-[11px] text-slate-500 truncate'>{order.customer.phone}</p>}
            </div>
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
                  className='w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0'
                />
              ) : (
                <div className='w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0'>
                  <Wrench className='w-3.5 h-3.5' />
                </div>
              )}
              <div className='min-w-0'>
                <p className='font-semibold text-slate-800 text-xs truncate'>{order.asset?.machineName || 'N/A'}</p>
                <p className='text-[10px] text-slate-400 truncate'>
                  {order.asset?.machineType} {order.asset?.modelName ? `• ${order.asset.modelName}` : ''}
                </p>
              </div>
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
                  id: 'edit',
                  label: 'Edit Order',
                  icon: Edit,
                  onClick: (row) => navigate(`/work-orders/edit/${row.id}`),
                },
                {
                  id: 'cancel',
                  label: 'Cancel Order',
                  icon: Ban,
                  danger: true,
                  disabled: order.status === 'CANCELLED' || order.status === 'COMPLETED',
                  onClick: (row) => handleCancelWorkOrder(row),
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
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-black text-slate-900 tracking-tight'>Work Orders</h1>
          <p className='text-xs text-slate-500'>Assigned field service tasks</p>
        </div>
        <Can roles={UserRole.ADMIN_DISPATCHER}>
          <Button
            size='sm'
            onClick={() => navigate('/work-orders/add')}
            leftIcon={<Plus className='w-3.5 h-3.5' />}
            className='bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] border-0 text-white rounded-xl shadow-xs text-xs font-bold px-3.5 py-2'
          >
            Assign Work
          </Button>
        </Can>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder='Search order #, service title, customer, or equipment...'
      />

      <Tabs<'ALL' | WorkOrderStatus> tabs={FILTER_TABS} activeTab={filter} onChange={setFilter} />

      {isLoading ? (
        <div className='bg-white rounded-2xl p-12 border border-slate-200 text-center flex flex-col items-center justify-center gap-2.5'>
          <Loader2 className='w-7 h-7 animate-spin text-[#D12026]' />
          <p className='text-xs font-semibold text-slate-500'>Loading work orders from database...</p>
        </div>
      ) : workOrders.length === 0 ? (
        <EmptyState
          title='No work orders found'
          description={
            searchTerm || filter !== 'ALL'
              ? 'Try changing your search query or filter tab.'
              : 'Dispatch your first work order to start managing field assignments.'
          }
          actionText='+ Assign Work'
          onAction={() => navigate('/work-orders/add')}
        />
      ) : (
        <>
          <div className='block md:hidden space-y-3'>
            {workOrders.map((order) => (
              <EntityCard
                key={order.id}
                title={order.title}
                subtitle={`${order.orderNumber} • ${order.customer?.name || 'Customer'}`}
                location={order.customer?.address}
                image={order.asset?.imageUrl || undefined}
                statusBadgeValue={order.status}
                details={{
                  Equipment: `${order.asset?.machineName || 'N/A'} (${order.asset?.modelName || 'General'})`,
                  Technician: order.technician?.name || 'Unassigned',
                  Scheduled: `${order.scheduledDate} ${order.scheduledTime ? `at ${order.scheduledTime}` : ''}`,
                }}
                leftStat={<span className='font-semibold text-slate-600'>{order.priority} Priority</span>}
                rightStat={<span className='font-bold text-[#D12026]'>{order.status}</span>}
                rightIcon={
                  <Can roles={UserRole.ADMIN_DISPATCHER}>
                    <div onClick={(e) => e.stopPropagation()}>
                      <TableActionMenu
                        row={order}
                        actionItems={[
                          {
                            id: 'edit',
                            label: 'Edit Order',
                            icon: Edit,
                            onClick: (row) => navigate(`/work-orders/edit/${row.id}`),
                          },
                          {
                            id: 'cancel',
                            label: 'Cancel Order',
                            icon: Ban,
                            danger: true,
                            disabled: order.status === 'CANCELLED' || order.status === 'COMPLETED',
                            onClick: (row) => handleCancelWorkOrder(row),
                          },
                        ]}
                      />
                    </div>
                  </Can>
                }
              />
            ))}
          </div>

          <div className='hidden md:block'>
            <Table<WorkOrder> columns={columns} data={workOrders} keyExtractor={(order) => order.id} hoverable />
          </div>
        </>
      )}
    </div>
  );
};

export default WorkOrdersPage;
