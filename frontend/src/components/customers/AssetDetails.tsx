import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Building2, Trash2 } from 'lucide-react';
import { Button, Table, TableActionMenu, StatusBadge, EntityCard, EmptyState, Tabs, type Column } from '../ui';
import { mapObjectValues } from '../../utils';
import { ASSET_COLUMNS } from '../../constants';
import { deleteAsset, type Asset } from '../../services/assetService';

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

  useEffect(() => {
    setAssetList(assets);
  }, [assets]);

  const tabList: { id: ActiveTab; label: string; count?: number }[] = useMemo(
    () => [
      { id: 'assets', label: 'Assets', count: assetList.length },
      { id: 'jobs', label: 'Active Jobs', count: 0 },
      { id: 'history', label: 'History' },
    ],
    [assetList.length]
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
        <div className='flex-1 min-h-0 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs'>
          <EmptyState
            title='No active jobs'
            description='There are no active jobs or work orders currently assigned for this customer.'
            actionText='+ Create Job'
            onAction={() => navigate('/work-orders')}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className='flex-1 min-h-0 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs'>
          <EmptyState
            title='No service history'
            description='Completed jobs, service logs, and maintenance reports will appear here.'
          />
        </div>
      )}
    </div>
  );
};

export default AssetDetails;
