import type { FC } from 'react';
import { EntityCard } from '../ui/EntityCard';

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  countryCode?: string;
  email: string;
  address: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | boolean;
  assetsCount?: number;
  activeOrders?: number;
}

export interface CustomerCardProps {
  customer: Customer;
  onClick?: (customer: Customer) => void;
  className?: string;
}

export const CustomerCard: FC<CustomerCardProps> = ({
  customer,
  onClick,
  className = '',
}) => {

  return (
    <EntityCard
      title={customer.name}
      subtitle={customer.phone}
      location={customer.address}
      leftStat={`${customer?.assetsCount} Assets`}
      rightStat={`${customer?.activeOrders} Active Jobs`}
      onClick={() => onClick?.(customer)}
      className={className}
    />
  );
};

export default CustomerCard;
