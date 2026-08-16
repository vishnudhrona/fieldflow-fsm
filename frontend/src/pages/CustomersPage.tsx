import { useState, useEffect, useMemo, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Edit, UserX, UserCheck } from 'lucide-react';
import { CustomerCard, type Customer } from '../components/customers';
import { Table, TableActionMenu, Button, Input, StatusBadge, type Column } from '../components/ui';
import { mapObjectValues } from '../utils';
import { CUSTOMER_COLUMNS } from '../constants';
import { useDebounce } from '../hooks';
import { getCustomers, updateCustomer } from '../services/customerService';

export const CustomersPage: FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchCustomers = async (searchQuery?: string) => {
    try {
      const data = await getCustomers(searchQuery);
      const mapped: Customer[] = data.map((c) => ({
        id: c.id,
        name: c.name,
        contactPerson: c.contactPerson || 'N/A',
        phone: c.phone,
        email: c.email,
        address: c.address,
        notes: c.notes || undefined,
        status: c.status ? 'ACTIVE' : 'INACTIVE',
        activeOrders: 0,
      }));
      setCustomers(mapped);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
    }
  };

  useEffect(() => {
    fetchCustomers(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const handleToggleStatus = async (customer: Customer) => {
    const nextStatusBool = customer.status !== 'ACTIVE';
    try {
      await updateCustomer(customer.id, { status: nextStatusBool });
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: nextStatusBool ? 'ACTIVE' : 'INACTIVE' } : c)),
      );
    } catch (err) {
      console.error('Failed to toggle customer status:', err);
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
        cell: (customer: Customer) => (
          <StatusBadge status={customer.status === 'ACTIVE'} rounded='full' size='xs' />
        ),
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
  }, []);

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

      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder='Search customer, contact person, phone, or location...'
        leftIcon={<Search className='w-4 h-4 text-slate-400' />}
        className='py-2.5 rounded-2xl border-slate-200 shadow-xs'
      />

      <div className='block md:hidden space-y-3'>
        {customers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} onClick={(c) => navigate(`/customers/${c.id}`)} />
        ))}
      </div>

      <div className='hidden md:block'>
        <Table
          columns={columns}
          data={customers}
          onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        />
      </div>
    </div>
  );
};

export default CustomersPage;
