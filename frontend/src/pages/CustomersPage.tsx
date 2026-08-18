import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Edit, UserX, UserCheck } from 'lucide-react';
import { Table, TableActionMenu, Button, SearchBar, StatusBadge, EntityCard, EmptyState, type Column } from '../components/ui';
import { mapObjectValues } from '../utils';
import { CUSTOMER_COLUMNS } from '../constants';
import { useDebounce } from '../hooks';
import { getCustomers, updateCustomer, type Customer } from '../services/customerService';

export const CustomersPage: FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async (searchQuery?: string) => {
    try {
      const data = await getCustomers(searchQuery);   
      console.log(19,data);
      const mapped: Customer[] = data.map((c) => ({
        id: c.id,
        name: c.name,
        contactPerson: c.contactPerson || 'N/A',
        phone: c.phone,
        email: c.email,
        address: c.address,
        status: c.status ? 'ACTIVE' : 'INACTIVE',
        assetsCount: c.assets?.length ?? 0,
        activeOrders: c.workOrders?.length ?? 0,
        createdAt: c.createdAt || new Date().toISOString(),
      }));
      setCustomers(mapped);
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleToggleStatus = async (customer: Customer) => {
    const previousStatus = customer.status;
    const nextStatus = previousStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatus } : c)));

    try {
      await updateCustomer(customer.id, { status: nextStatus === 'ACTIVE' });
    } catch (err: any) {
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, status: previousStatus } : c)));
      alert(err?.response?.data?.message || 'Failed to update customer status. Please try again.');
    }
  };

  const columns = useMemo<Column<Customer>[]>(() => {
    const dataColumns = mapObjectValues(CUSTOMER_COLUMNS, ['header']);

    return [
      ...dataColumns,
      {
        header: 'Status',
        accessor: 'status',
        align: 'center',
        cell: (customer: Customer) => <StatusBadge status={customer.status === 'ACTIVE'} rounded='full' size='xs' />,
      },
      {
        header: 'Actions',
        accessor: 'id',
        align: 'center',
        cell: (customer: Customer) => (
          <TableActionMenu
            row={customer}
            actionItems={[
              {
                id: 'edit',
                label: 'Edit Customer',
                icon: Edit,
                onClick: (row) => navigate(`/customers/edit/${row.id}`),
              },
              {
                id: 'toggle-status',
                label: customer.status === 'ACTIVE' ? 'Set as Inactive' : 'Set as Active',
                icon: customer.status === 'ACTIVE' ? UserX : UserCheck,
                danger: customer.status === 'ACTIVE',
                onClick: (row) => handleToggleStatus(row),
              },
            ]}
          />
        ),
      },
    ];
  }, [customers]);

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-black text-slate-900 tracking-tight'>Customers</h1>
          <p className='text-xs text-slate-500'>Browse clients and site locations</p>
        </div>
        <Button
          size='sm'
          onClick={() => navigate('/customers/add')}
          leftIcon={<UserPlus className='w-3.5 h-3.5' />}
          className='bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] border-0 text-white rounded-xl shadow-xs text-xs font-bold px-3.5 py-2'
        >
          Add Client
        </Button>
      </div>

      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder='Search customer, contact person, phone, or location...'
      />

      {customers.length === 0 ? (
        <EmptyState
          title='No customers found'
          description={
            searchTerm
              ? 'No client accounts match your search query.'
              : 'Add your first customer account to get started.'
          }
          actionText='+ Add Client'
          onAction={() => navigate('/customers/add')}
        />
      ) : (
        <>
          <div className='block md:hidden space-y-3'>
            {customers.map((customer) => (
              <EntityCard
                key={customer.id}
                title={customer.name}
                subtitle={customer.phone}
                location={customer.address}
                statusBadgeValue={customer.status === 'ACTIVE'}
                leftStat={`${customer.assetsCount ?? 0} Assets`}
                rightStat={`${customer.activeOrders ?? 0} Active Jobs`}
                onClick={() => navigate(`/customers/${customer.id}`)}
              />
            ))}
          </div>

          <div className='hidden md:block'>
            <Table
              columns={columns}
              data={customers}
              onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
              hoverable
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CustomersPage;
