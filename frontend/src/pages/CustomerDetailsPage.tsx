import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Edit, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Button, StatusBadge } from '../components/ui';
import { SubpageHeader } from '../components/navigation';
import { getCustomerById, updateCustomer, type Customer } from '../services/customerService';
import { type AssetItem, AssetDetails } from '../components/customers';

export const CustomerDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCustomer = async () => {
      setIsLoading(true);
      setErrorMessage(null);
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

        setAssets(data.assets || []);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || 'Failed to load customer details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!customer || !id) return;
    const previousStatus = customer.status;
    const nextStatus = previousStatus !== 'ACTIVE';

    setCustomer((prev) => (prev ? { ...prev, status: nextStatus ? 'ACTIVE' : 'INACTIVE' } : prev));

    try {
      await updateCustomer(id, { status: nextStatus });
    } catch (err: any) {
      setCustomer((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      alert(err?.response?.data?.message || 'Failed to update customer status. Please try again.');
    }
  };

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
      <div className='min-h-screen flex flex-col items-center justify-center py-20 text-slate-500 gap-3'>
        <p className='text-xs font-semibold text-slate-700'>{errorMessage || 'Customer not found.'}</p>
        <Button size='sm' onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const isActive = customer.status === 'ACTIVE' || customer.status === true;

  return (
    <div className='flex flex-col h-[calc(100dvh-4rem)] md:h-auto overflow-hidden md:overflow-visible bg-slate-50/60 md:bg-transparent font-sans'>
      <SubpageHeader
        title={customer.name}
        backPath='/customers'
        className='shrink-0 bg-white border-b border-slate-200 sticky top-0 z-30'
        actionItems={[
          {
            id: 'edit',
            label: 'Edit Customer',
            icon: Edit,
            onClick: () => navigate(`/customers/edit/${id}`),
          },
          {
            id: 'toggle-status',
            label: isActive ? 'Set as Inactive' : 'Set as Active',
            icon: isActive ? UserX : UserCheck,
            danger: isActive,
            onClick: handleToggleStatus,
          },
        ]}
      />

      <div className='px-4 md:px-0 pt-3 md:pt-0 pb-2 shrink-0'>
        <div className='bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-start gap-3.5 min-w-0 flex-1'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/80 border border-rose-200/70 flex items-center justify-center text-[#D12026] shrink-0 shadow-2xs'>
                <User className='w-6 h-6 stroke-[1.8]' />
              </div>

              <div className='min-w-0 flex-1'>
                {customer.name && <h2 className='text-sm font-bold text-slate-900 truncate'>{customer.name}</h2>}
                {customer.contactPerson && (
                  <p className='text-xs text-slate-500 font-medium truncate mt-0.5'>{customer.contactPerson}</p>
                )}

                <div className='mt-2.5 space-y-1.5 pt-2 border-t border-slate-100'>
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className='flex items-center gap-2 text-xs font-semibold text-[#D12026] hover:underline'
                    >
                      <Phone className='w-3.5 h-3.5 shrink-0' />
                      <span>{customer.phone}</span>
                    </a>
                  )}

                  {customer.email && (
                    <div className='flex items-center gap-2 text-xs text-slate-500 font-normal'>
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
              </div>
            </div>

            <div className='shrink-0'>
              <StatusBadge status={isActive} size='xs' />
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 min-h-0 flex flex-col px-3 md:px-0 pt-1 pb-2 overflow-hidden md:overflow-visible'>
        <AssetDetails customerId={id} assets={assets} />
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
