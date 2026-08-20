import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Building2, Trash2, Loader2, UserCheck, Calendar, Eye } from 'lucide-react';
import { Button, Table, TableActionMenu, StatusBadge, EntityCard, EmptyState, Tabs, type Column } from '../ui';
import { mapObjectValues } from '../../utils';
import { ASSET_COLUMNS, ASSET_JOB_COLUMNS, ASSET_HISTORY_COLUMNS } from '../../constants';
import { deleteAsset, type Asset } from '../../services/assetService';
import { getWorkOrders, type WorkOrder } from '../../services/workOrderService';

export type AssetItem = Asset;
export type ActiveTab = 'assets' | 'jobs' | 'history';

export interface AssetDetailsProps {
  customerId?: string;
  assets: Asset[];
  isMobile?: boolean;
}

export const AssetDetails: FC<AssetDetailsProps> = ({ customerId, assets }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');
  const [assetList, setAssetList] = useState<Asset[]>(assets);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  useEffect(() => {
    setAssetList(assets);
  }, [assets]);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoadingJobs(true);
      try {
        const orders = await getWorkOrders();
        setWorkOrders(orders);
      } catch (err) {
        console.error('Failed to fetch work orders for assets:', err);
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [customerId, assets]);

  const activeJobs = useMemo(() => {
    const assetIdSet = new Set(assetList.map((a) => a.id));
    return workOrders.filter((order) => {
      const matchesCustomerOrAsset = (customerId && order.customerId === customerId) || assetIdSet.has(order.assetId);
      const isActiveStatus = order.status === 'NEW' || order.status === 'PENDING' || order.status === 'IN_PROGRESS';
      return matchesCustomerOrAsset && isActiveStatus;
    });
  }, [workOrders, customerId, assetList]);

  const historyJobs = useMemo(() => {
    const assetIdSet = new Set(assetList.map((a) => a.id));
    return workOrders.filter((order) => {
      const matchesCustomerOrAsset = (customerId && order.customerId === customerId) || assetIdSet.has(order.assetId);
      const isHistoryStatus = order.status === 'COMPLETED' || order.status === 'CANCELLED';
      return matchesCustomerOrAsset && isHistoryStatus;
    });
  }, [workOrders, customerId, assetList]);

  const tabList: { id: ActiveTab; label: string; count?: number }[] = useMemo(
    () => [
      { id: 'assets', label: 'Assets', count: assetList.length },
      { id: 'jobs', label: 'Active Jobs', count: activeJobs.length },
      { id: 'history', label: 'History', count: historyJobs.length },
    ],
    [assetList.length, activeJobs.length, historyJobs.length]
  );

  const handleDeleteAsset = async (asset: Asset) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${asset.machineName}"? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(asset.id);
    try {
      await deleteAsset(asset.id);
      setAssetList((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete asset. Please try again.');
    }
  };

  const assetColumns = useMemo<Column<Asset>[]>(() => {
    const baseColumns = mapObjectValues(ASSET_COLUMNS, ['header']);

    return baseColumns.map((col: any) => {
      if (col.accessor === 'machineName') {
        return {
          ...col,
          cell: (asset: Asset) => (
            <div className='flex items-center gap-2.5'>
              <div className='w-11 h-11 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs'>
                {asset.imageUrl ? (
                  <img
                    src={asset.imageUrl}
                    alt={asset.machineName}
                    className='w-full h-full object-contain'
                    loading='lazy'
                  />
                ) : (
                  <Building2 className='w-5 h-5 text-slate-400' />
                )}
              </div>
              <div>
                <span className='text-slate-900 font-bold text-xs block leading-snug'>{asset.machineName}</span>
                <span className='text-[11px] font-medium text-slate-500'>{asset.machineType || 'General'}</span>
              </div>
            </div>
          ),
        };
      }

      if (col.accessor === 'installationDate') {
        return {
          ...col,
          cell: (asset: Asset) => (
            <span className='text-xs text-slate-600 font-normal'>
              {asset.installationDate
                ? new Date(asset.installationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          ),
        };
      }

      if (col.accessor === 'status') {
        return {
          ...col,
          align: 'center',
          cell: (asset: Asset) => <StatusBadge status={asset.status} rounded='full' size='xs' />,
        };
      }

      if (col.accessor === 'actions') {
        return {
          ...col,
          align: 'center',
          cell: (asset: Asset) => (
            <TableActionMenu
              row={asset}
              actionItems={[
                {
                  id: 'edit',
                  label: 'Edit Asset',
                  icon: Edit,
                  onClick: () =>
                    navigate(customerId ? `/customers/${customerId}/assets/edit/${asset.id}` : '/customers'),
                },
                {
                  id: 'delete',
                  label:'Delete Asset',
                  icon: Trash2,
                  danger: true,
                  onClick: () => handleDeleteAsset(asset),
                },
              ]}
            />
          ),
        };
      }

      return col;
    });
  }, [customerId, navigate, isDeleting]);

  const jobColumns = useMemo<Column<WorkOrder>[]>(() => {
    const baseColumns = mapObjectValues(ASSET_JOB_COLUMNS, ['header']);

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
            <span className='font-semibold text-slate-800 text-xs block truncate max-w-xs'>
              {order.title}
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
              <div className='min-w-0'>
                <p className='font-semibold text-slate-800 text-xs truncate'>{order.asset?.machineName || 'Equipment'}</p>
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

  const historyColumns = useMemo<Column<WorkOrder>[]>(() => {
    const baseColumns = mapObjectValues(ASSET_HISTORY_COLUMNS, ['header']);

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
            <span className='font-semibold text-slate-800 text-xs block truncate max-w-xs'>
              {order.title}
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
              <div className='min-w-0'>
                <p className='font-semibold text-slate-800 text-xs truncate'>{order.asset?.machineName || 'Equipment'}</p>
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

      if (col.accessor === 'completedAt') {
        return {
          ...col,
          cell: (order: WorkOrder) => {
            const rawDate =
              order.completedAt ||
              (order.status === 'COMPLETED' ? order.updatedAt || order.scheduledDate : null);
            if (!rawDate) return <span className='text-xs text-slate-400'>—</span>;
            const parsed = new Date(rawDate);
            const display = isNaN(parsed.getTime())
              ? '—'
              : parsed.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
            return <span className='text-xs text-slate-600 font-normal'>{display}</span>;
          },
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
              ]}
            />
          ),
        };
      }

      return col;
    });
  }, [navigate]);

  return (
    <div className='flex-1 flex flex-col min-h-0 space-y-2.5'>
      <div className='shrink-0'>
        <Tabs<ActiveTab> tabs={tabList} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'assets' && (
        <>
          <div className='flex-1 flex flex-col min-h-0 md:hidden'>
            <div className='flex-1 overflow-y-auto overscroll-contain space-y-3 py-1 pr-0.5 min-h-0'>
              {assetList.length > 0 ? (
                assetList.map((asset) => (
                  <EntityCard
                    key={asset.id}
                    title={asset.machineName}
                    subtitle={`${asset.machineType || ''} ${asset.modelName ? `• ${asset.modelName}` : ''}`}
                    image={asset.imageUrl || undefined}
                    statusBadgeValue={asset.status}
                    details={{
                      'Serial Number': asset.serialNumber || 'N/A',
                      'Installation Date': asset.installationDate
                        ? new Date(asset.installationDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A',
                    }}
                    rightIcon={
                      <div onClick={(e) => e.stopPropagation()}>
                        <TableActionMenu
                          row={asset}
                          actionItems={[
                            {
                              id: 'edit',
                              label: 'Edit Asset',
                              icon: Edit,
                              onClick: () =>
                                navigate(
                                  customerId
                                    ? `/customers/${customerId}/assets/edit/${asset.id}`
                                    : '/customers'
                                ),
                            },
                            {
                              id: 'delete',
                              label: 'Delete Asset',
                              icon: Trash2,
                              danger: true,
                              onClick: () => handleDeleteAsset(asset),
                            },
                          ]}
                        />
                      </div>
                    }
                    onClick={() =>
                      navigate(customerId ? `/customers/${customerId}/assets/edit/${asset.id}` : '/customers')
                    }
                  />
                ))
              ) : (
                <EmptyState
                  title='No assets found'
                  description='Add assets to start managing equipment for this customer.'
                  actionText='+ Add Asset'
                  onAction={() => navigate(customerId ? `/customers/${customerId}/assets/add` : '/customers')}
                />
              )}
            </div>

            <div className='shrink-0 pt-2 pb-0 mt-auto'>
              <Button
                fullWidth
                size='lg'
                leftIcon={<Plus className='w-4.5 h-4.5 stroke-[2.5]' />}
                onClick={() => navigate(customerId ? `/customers/${customerId}/assets/add` : '/customers')}
                className='py-3.5 px-4 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] text-white font-extrabold text-sm tracking-wide shadow-md transition-all border-0 cursor-pointer flex items-center justify-center gap-2'
              >
                Add Asset
              </Button>
            </div>
          </div>

          <div className='space-y-4 md:block hidden'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-bold text-slate-900 tracking-tight'>Registered Equipment & Assets</h3>
                <p className='text-xs text-slate-500'>Assets linked to this customer account</p>
              </div>

              <Button
                size='sm'
                onClick={() => navigate(customerId ? `/customers/${customerId}/assets/add` : '/customers')}
                leftIcon={<Plus className='w-3.5 h-3.5 stroke-[2.5]' />}
                className='bg-[#D12026] hover:bg-[#B11A1F] text-white border-0 rounded-xl text-xs font-bold px-3 py-1.5 shadow-xs cursor-pointer'
              >
                Add Asset
              </Button>
            </div>

            <Table<Asset>
              columns={assetColumns}
              data={assetList}
              keyExtractor={(asset) => asset.id}
              hoverable
              emptyState={
                <EmptyState
                  title='No assets registered'
                  description='This customer does not have any equipment or assets registered yet.'
                  actionText='+ Register First Asset'
                  onAction={() => navigate(customerId ? `/customers/${customerId}/assets/add` : '/customers')}
                />
              }
            />
          </div>
        </>
      )}

      {activeTab === 'jobs' && (
        <>
          {/* Mobile View: EntityCard List */}
          <div className='flex-1 flex flex-col min-h-0 md:hidden'>
            <div className='flex-1 overflow-y-auto overscroll-contain space-y-3 py-1 pr-0.5 min-h-0'>
              {isLoadingJobs ? (
                <div className='bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center gap-2'>
                  <Loader2 className='w-6 h-6 animate-spin text-[#D12026]' />
                  <span className='text-xs font-semibold text-slate-500'>Loading active jobs...</span>
                </div>
              ) : activeJobs.length > 0 ? (
                activeJobs.map((job) => (
                  <EntityCard
                    key={job.id}
                    title={job.title}
                    subtitle={`${job.orderNumber} • ${job.asset?.machineName || 'Equipment'}`}
                    image={job.asset?.imageUrl || undefined}
                    statusBadgeValue={job.status}
                    details={{
                      Priority: job.priority,
                      Technician: job.technician?.name || 'Unassigned',
                      Scheduled: `${job.scheduledDate}${job.scheduledTime ? ` (${job.scheduledTime})` : ''}`,
                    }}
                    onClick={() => navigate(`/work-orders/${job.id}`)}
                  />
                ))
              ) : (
                <EmptyState
                  title='No active jobs'
                  description='There are no active jobs (New, Pending, or In Progress) for these assets.'
                  actionText='+ Create Job'
                  onAction={() =>
                    navigate(customerId ? `/work-orders/add?customerId=${customerId}` : '/work-orders/add')
                  }
                />
              )}
            </div>

            <div className='shrink-0 pt-2 pb-0 mt-auto'>
              <Button
                fullWidth
                size='lg'
                leftIcon={<Plus className='w-4.5 h-4.5 stroke-[2.5]' />}
                onClick={() =>
                  navigate(customerId ? `/work-orders/add?customerId=${customerId}` : '/work-orders/add')
                }
                className='py-3.5 px-4 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] text-white font-extrabold text-sm tracking-wide shadow-md transition-all border-0 cursor-pointer flex items-center justify-center gap-2'
              >
                Create Job
              </Button>
            </div>
          </div>

          <div className='space-y-4 md:block hidden'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-bold text-slate-900 tracking-tight'>Active Work Orders</h3>
                <p className='text-xs text-slate-500'>New, Pending, and In-Progress service jobs for this equipment</p>
              </div>

              <Button
                size='sm'
                onClick={() =>
                  navigate(customerId ? `/work-orders/add?customerId=${customerId}` : '/work-orders/add')
                }
                leftIcon={<Plus className='w-3.5 h-3.5 stroke-[2.5]' />}
                className='bg-[#D12026] hover:bg-[#B11A1F] text-white border-0 rounded-xl text-xs font-bold px-3 py-1.5 shadow-xs cursor-pointer'
              >
                Create Job
              </Button>
            </div>

            <Table<WorkOrder>
              columns={jobColumns}
              data={activeJobs}
              keyExtractor={(job) => job.id}
              hoverable
              emptyState={
                <EmptyState
                  title='No active jobs'
                  description='There are no active jobs or work orders currently assigned for this customer.'
                  actionText='+ Create First Job'
                  onAction={() =>
                    navigate(customerId ? `/work-orders/add?customerId=${customerId}` : '/work-orders/add')
                  }
                />
              }
            />
          </div>
        </>
      )}

      {activeTab === 'history' && (
        <>
          <div className='flex-1 flex flex-col min-h-0 md:hidden'>
            <div className='flex-1 overflow-y-auto overscroll-contain space-y-3 py-1 pr-0.5 min-h-0'>
              {isLoadingJobs ? (
                <div className='bg-white rounded-2xl p-8 border border-slate-200 text-center flex flex-col items-center justify-center gap-2'>
                  <Loader2 className='w-6 h-6 animate-spin text-[#D12026]' />
                  <span className='text-xs font-semibold text-slate-500'>Loading job history...</span>
                </div>
              ) : historyJobs.length > 0 ? (
                historyJobs.map((job) => (
                  <EntityCard
                    key={job.id}
                    title={job.title}
                    subtitle={`${job.orderNumber} • ${job.asset?.machineName || 'Equipment'}`}
                    image={job.asset?.imageUrl || undefined}
                    statusBadgeValue={job.status}
                    details={{
                      Priority: job.priority,
                      Technician: job.technician?.name || 'Unassigned',
                      Completed: (() => {
                        const raw = job.completedAt || (job.status === 'COMPLETED' ? job.updatedAt || job.scheduledDate : null);
                        if (!raw) return 'N/A';
                        const d = new Date(raw);
                        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                      })(),
                    }}
                    onClick={() => navigate(`/work-orders/${job.id}`)}
                  />
                ))
              ) : (
                <EmptyState
                  title='No service history'
                  description='Completed jobs, service logs, and maintenance reports will appear here.'
                />
              )}
            </div>
          </div>

          <div className='space-y-4 md:block hidden'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-sm font-bold text-slate-900 tracking-tight'>Service & Maintenance History</h3>
                <p className='text-xs text-slate-500'>Completed and archived work order history</p>
              </div>
            </div>

            <Table<WorkOrder>
              columns={historyColumns}
              data={historyJobs}
              keyExtractor={(job) => job.id}
              hoverable
              emptyState={
                <EmptyState
                  title='No service history'
                  description='Completed jobs, service logs, and maintenance reports will appear here.'
                />
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AssetDetails;
