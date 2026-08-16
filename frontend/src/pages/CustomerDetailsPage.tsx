import { useState, useEffect, useMemo, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  UserCheck,
  UserX,
  Loader2,
  Building2,
  FileText,
  Layers,
  Wrench,
} from 'lucide-react';
import {
  Button,
  EmptyState,
  Tabs,
  StatusBadge,
  EntityCard,
  Table,
  TableActionMenu,
  type Column,
} from '../components/ui';
import { SubpageHeader } from '../components/navigation';
import { getCustomerById, updateCustomer } from '../services/customerService';
import type { Customer } from '../components/customers';

type ActiveTab = 'assets' | 'jobs' | 'history';

interface AssetItem {
  id: string;
  name: string;
  tag: string;
  serialNumber: string;
  status: 'ACTIVE' | 'UNDER_SERVICE' | 'INACTIVE';
  imageUrl?: string;
}

const SAMPLE_ASSETS: AssetItem[] = [
  {
    id: '1',
    name: 'Dell Latitude 5420',
    tag: 'AST-001',
    serialNumber: 'DELL784521',
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '2',
    name: 'HP ProBook 450',
    tag: 'AST-002',
    serialNumber: 'HP456789',
    status: 'UNDER_SERVICE',
    imageUrl: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '3',
    name: 'Lenovo ThinkPad E14',
    tag: 'AST-003',
    serialNumber: 'LEN123456',
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '4',
    name: 'MacBook Pro 14" M2',
    tag: 'AST-004',
    serialNumber: 'APL982314',
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '5',
    name: 'Asus ExpertBook B9',
    tag: 'AST-005',
    serialNumber: 'ASUS332190',
    status: 'UNDER_SERVICE',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&auto=format&fit=crop&q=80',
  },
];

export const CustomerDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assets] = useState<AssetItem[]>(SAMPLE_ASSETS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('assets');
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      setIsLoading(true);
      try {
        const data = await getCustomerById(id);
        setCustomer({
          id: data.id,
          name: data.name,
          contactPerson: data.contactPerson || undefined,
          phone: data.phone,
          email: data.email,
          address: data.address,
          notes: data.notes || undefined,
          status: data.status ? 'ACTIVE' : 'INACTIVE',
          activeOrders: 0,
        });
      } catch (err) {
        console.error('Failed to load customer details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!customer || !id) return;
    const nextStatus = customer.status !== 'ACTIVE';
    try {
      setCustomer((prev) => (prev ? { ...prev, status: nextStatus ? 'ACTIVE' : 'INACTIVE' } : prev));
      await updateCustomer(id, { status: nextStatus });
    } catch (err) {
      console.error('Failed to toggle customer status:', err);
    }
  };

  const assetColumns = useMemo<Column<AssetItem>[]>(
    () => [
      {
        header: 'Asset',
        accessor: 'name',
        cell: (asset: AssetItem) => (
          <div className='flex items-center gap-3.5'>
            <div className='w-12 h-12 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden p-1 shadow-2xs'>
              {asset.imageUrl ? (
                <img
                  src={asset.imageUrl}
                  alt={asset.name}
                  className='w-full h-full object-contain'
                  loading='lazy'
                />
              ) : (
                <Building2 className='w-5 h-5 text-slate-400' />
              )}
            </div>
            <div>
              <span className='font-bold text-slate-900 text-xs block leading-snug'>
                {asset.name}
              </span>
              <span className='text-[11px] font-semibold text-slate-500'>
                {asset.tag}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: 'Tag',
        accessor: 'tag',
        cell: (asset: AssetItem) => (
          <span className='font-mono text-xs font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200/80'>
            {asset.tag}
          </span>
        ),
      },
      {
        header: 'Serial Number',
        accessor: 'serialNumber',
        cell: (asset: AssetItem) => (
          <span className='text-xs font-medium text-slate-700'>
            {asset.serialNumber}
          </span>
        ),
      },
      {
        header: 'Status',
        accessor: 'status',
        align: 'center',
        cell: (asset: AssetItem) => (
          <StatusBadge status={asset.status} size='xs' />
        ),
      },
      {
        header: 'Actions',
        accessor: 'id',
        align: 'center',
        cell: (asset: AssetItem) => (
          <TableActionMenu
            row={asset}
            actionItems={[
              {
                id: 'view',
                label: 'View Details',
                icon: Edit,
                onClick: () => {},
              },
              {
                id: 'request-job',
                label: 'Create Job',
                icon: Plus,
                onClick: () => navigate('/work-orders'),
              },
            ]}
          />
        ),
      },
    ],
    [navigate],
  );

  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center py-20 text-slate-500 gap-3'>
        <Loader2 className='w-8 h-8 animate-spin text-[#D12026]' />
        <span className='text-xs font-semibold'>Loading customer details...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className='max-w-lg mx-auto p-6'>
        <EmptyState
          title='Customer Not Found'
          description='The requested customer profile could not be loaded.'
          actionText='Back to Customers'
          onAction={() => navigate('/customers')}
        />
      </div>
    );
  }

  const isActive = customer.status === 'ACTIVE' || customer.status === true;

  const tabList = [
    { id: 'assets' as const, label: 'Assets', count: assets.length },
    { id: 'jobs' as const, label: 'Active Jobs', count: 0 },
    { id: 'history' as const, label: 'History' },
  ];

  return (
    <div>
      {/* ========================================================================= */}
      {/* MOBILE / PHONE VIEW (Sticky Top Customer Header, Scrollable Cards, Sticky Bottom CTA) */}
      {/* ========================================================================= */}
      <div className='block md:hidden h-[calc(100dvh-64px)] flex flex-col bg-slate-50 overflow-hidden'>
        {/* 1. Sticky Subpage Header */}
        <div className='shrink-0'>
          <SubpageHeader
            title='Customer Details'
            backPath='/customers'
            rightAction={
              <div className='relative'>
                <button
                  type='button'
                  onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
                  className='p-1.5 -mr-1 rounded-xl text-slate-800 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer'
                >
                  <MoreVertical className='w-5 h-5' />
                </button>

                {isHeaderMenuOpen && (
                  <div className='absolute right-0 top-full mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95'>
                    <button
                      type='button'
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        navigate(`/customers/edit/${id}`);
                      }}
                      className='w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 text-left cursor-pointer'
                    >
                      <Edit className='w-4 h-4 text-slate-500' />
                      <span>Edit Customer</span>
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        handleToggleStatus();
                      }}
                      className={`w-full px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center gap-2.5 text-left cursor-pointer ${
                        isActive ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isActive ? (
                        <UserX className='w-4 h-4 text-rose-500' />
                      ) : (
                        <UserCheck className='w-4 h-4 text-emerald-500' />
                      )}
                      <span>{isActive ? 'Set as Inactive' : 'Set as Active'}</span>
                    </button>
                  </div>
                )}
              </div>
            }
          />
        </div>

        {/* 2. Sticky Customer Info Section + Tab Bar */}
        <div className='shrink-0 bg-slate-50 z-10'>
          <div className='max-w-xl mx-auto px-4 pt-3.5 pb-1 space-y-3.5'>
            {/* Customer Main Info Card */}
            <div className='space-y-3.5'>
              <div className='flex items-start justify-between gap-3'>
                {/* Avatar Circle */}
                <div className='w-14 h-14 rounded-full bg-gradient-to-br from-rose-50 to-rose-100/80 border border-rose-200/70 flex items-center justify-center text-[#D12026] shrink-0 shadow-2xs'>
                  <User className='w-7 h-7 stroke-[1.8]' />
                </div>

                {/* Customer Main Info */}
                <div className='space-y-1 flex-1 min-w-0'>
                  <h2 className='text-lg font-black text-slate-900 tracking-tight leading-snug truncate'>
                    {customer.name}
                  </h2>

                  {customer.phone && (
                    <div className='flex items-center gap-2 text-xs font-semibold text-slate-700'>
                      <Phone className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                      <span>{customer.phone}</span>
                    </div>
                  )}

                  {customer.email && (
                    <div className='flex items-center gap-2 text-xs text-slate-600 font-medium'>
                      <Mail className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                      <span className='truncate'>{customer.email}</span>
                    </div>
                  )}

                  {customer.address && (
                    <div className='flex items-center gap-2 text-xs text-slate-500 font-normal'>
                      <MapPin className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                      <span className='truncate'>{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <StatusBadge status={isActive} />
              </div>
            </div>

            {/* Tab Navigation Bar */}
            <Tabs<ActiveTab>
              tabs={tabList}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>

        {/* 3. Middle Scrollable Area: Assets shown as Cards */}
        <div className='flex-1 overflow-y-auto overscroll-contain px-4 py-3 min-h-0'>
          <div className='max-w-xl mx-auto'>
            {activeTab === 'assets' && (
              <div className='space-y-3'>
                {assets.length > 0 ? (
                  assets.map((asset) => (
                    <EntityCard
                      key={asset.id}
                      title={asset.name}
                      subtitle={asset.tag}
                      image={asset.imageUrl}
                      meta={
                        <div className='flex items-center justify-between gap-2 mt-0.5 flex-wrap'>
                          <span className='text-[11px] font-medium text-slate-700 truncate'>
                            Serial: {asset.serialNumber}
                          </span>
                          <StatusBadge status={asset.status} size='xs' />
                        </div>
                      }
                      onClick={() => {}}
                    />
                  ))
                ) : (
                  <EmptyState
                    title='No assets found'
                    description='Add assets to start managing equipment for this customer.'
                    actionText='+ Add Asset'
                    onAction={() => {}}
                  />
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className='pt-1'>
                <EmptyState
                  title='No active jobs'
                  description='There are no active jobs currently assigned for this customer.'
                  actionText='+ Create Job'
                  onAction={() => navigate('/work-orders')}
                />
              </div>
            )}

            {activeTab === 'history' && (
              <div className='pt-1'>
                <EmptyState
                  title='No service history'
                  description='Service records will appear here once jobs are completed.'
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. Sticky Bottom Action Button */}
        <div className='shrink-0 p-3.5 z-20'>
          <div className='max-w-xl mx-auto'>
            <Button
              fullWidth
              size='lg'
              leftIcon={<Plus className='w-4.5 h-4.5 stroke-[2.5]' />}
              onClick={() => {}}
              className='py-3 px-4 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] text-white font-extrabold text-sm tracking-wide shadow-md transition-all border-0 cursor-pointer flex items-center justify-center gap-2'
            >
              Add Asset
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LAPTOP / DESKTOP VIEW (Spacious Desktop Dashboard + Asset Data Table) */}
      {/* ========================================================================= */}
      <div className='hidden md:block space-y-6 pb-12 max-w-7xl mx-auto'>
        {/* Customer Profile Details Card */}
        <div className='bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
            {/* Left Col: Avatar & Status */}
            <div className='lg:col-span-4 flex items-start gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6'>
              <div className='w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/80 border border-rose-200/70 flex items-center justify-center text-[#D12026] shrink-0 shadow-2xs'>
                <User className='w-8 h-8 stroke-[1.8]' />
              </div>
              <div className='space-y-1.5 min-w-0 flex-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='text-lg font-black text-slate-900 tracking-tight leading-snug'>
                    {customer.name}
                  </h3>
                  <StatusBadge status={isActive} size='xs' />
                </div>
                {customer.contactPerson && (
                  <p className='text-xs font-semibold text-slate-600'>
                    Contact: <span className='text-slate-800 font-bold'>{customer.contactPerson}</span>
                  </p>
                )}
                <p className='text-[11px] font-medium text-slate-400'>
                  Client ID: <span className='font-mono text-slate-600'>{customer.id}</span>
                </p>
              </div>
            </div>

            {/* Middle Col: Contact Details */}
            <div className='lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-6'>
              <div className='space-y-1'>
                <span className='text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5'>
                  <Phone className='w-3 h-3 text-slate-400' />
                  Phone Number
                </span>
                <p className='text-xs font-bold text-slate-800 truncate'>
                  {customer.phone || '—'}
                </p>
              </div>

              <div className='space-y-1'>
                <span className='text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5'>
                  <Mail className='w-3 h-3 text-slate-400' />
                  Email Address
                </span>
                <p className='text-xs font-bold text-slate-800 truncate'>
                  {customer.email || '—'}
                </p>
              </div>

              <div className='sm:col-span-2 space-y-1'>
                <span className='text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5'>
                  <MapPin className='w-3 h-3 text-slate-400' />
                  Service Location
                </span>
                <p className='text-xs font-semibold text-slate-700'>
                  {customer.address || '—'}
                </p>
              </div>

              {customer.notes && (
                <div className='sm:col-span-2 space-y-1'>
                  <span className='text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5'>
                    <FileText className='w-3 h-3 text-slate-400' />
                    Notes
                  </span>
                  <p className='text-xs font-normal text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100'>
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right Col: Quick Overview Stats */}
            <div className='lg:col-span-3 grid grid-cols-2 gap-3'>
              <div className='bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 text-center space-y-1'>
                <div className='flex items-center justify-center text-slate-400'>
                  <Layers className='w-4 h-4 text-[#D12026]' />
                </div>
                <div className='text-xl font-black text-slate-900'>{assets.length}</div>
                <div className='text-[11px] font-bold text-slate-500 uppercase tracking-tight'>
                  Total Assets
                </div>
              </div>

              <div className='bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 text-center space-y-1'>
                <div className='flex items-center justify-center text-slate-400'>
                  <Wrench className='w-4 h-4 text-amber-600' />
                </div>
                <div className='text-xl font-black text-slate-900'>0</div>
                <div className='text-[11px] font-bold text-slate-500 uppercase tracking-tight'>
                  Active Jobs
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden'>
          <div className='px-6 pt-3 bg-slate-50/40 border-b border-slate-200/80'>
            <Tabs<ActiveTab>
              tabs={tabList}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          <div className='p-6'>
            {activeTab === 'assets' && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h3 className='text-sm font-bold text-slate-900 tracking-tight'>
                      Registered Equipment & Assets
                    </h3>
                    <p className='text-xs text-slate-500'>
                      Assets linked to this customer account
                    </p>
                  </div>

                  <Button
                    size='sm'
                    onClick={() => {}}
                    leftIcon={<Plus className='w-3.5 h-3.5 stroke-[2.5]' />}
                    className='bg-[#D12026] hover:bg-[#B11A1F] text-white border-0 rounded-xl text-xs font-bold px-3 py-1.5 shadow-xs'
                  >
                    Add Asset
                  </Button>
                </div>

                <Table<AssetItem>
                  columns={assetColumns}
                  data={assets}
                  keyExtractor={(asset) => asset.id}
                  hoverable
                />
              </div>
            )}

            {/* 2. Active Jobs Tab */}
            {activeTab === 'jobs' && (
              <EmptyState
                title='No active jobs'
                description='There are no active jobs or work orders currently assigned for this customer.'
                actionText='+ Create New Job'
                onAction={() => navigate('/work-orders')}
              />
            )}

            {/* 3. History Tab */}
            {activeTab === 'history' && (
              <EmptyState
                title='No service records found'
                description='Completed jobs, service logs, and maintenance reports will appear here.'
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
