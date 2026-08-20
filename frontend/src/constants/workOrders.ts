import { UserRole } from '../services/authService';

export const WORK_ORDER_COLUMNS = [
  { header: 'Order #', accessor: 'orderNumber', width: '110px' },
  { header: 'Job Title', accessor: 'title' },
  { header: 'Customer', accessor: 'customer' },
  { header: 'Asset / Machine', accessor: 'asset' },
  { header: 'Technician', accessor: 'technician' },
  { header: 'Priority', accessor: 'priority', align: 'center' as const },
  { header: 'Scheduled', accessor: 'scheduledDate' },
  { header: 'Status', accessor: 'status', align: 'center' as const },
  { header: 'Actions', accessor: 'id', align: 'center' as const, roles: UserRole.ADMIN_DISPATCHER },
];

export const ASSET_JOB_COLUMNS = [
  { header: 'Order #', accessor: 'orderNumber', width: '110px' },
  { header: 'Job Title', accessor: 'title' },
  { header: 'Equipment / Asset', accessor: 'asset' },
  { header: 'Technician', accessor: 'technician' },
  { header: 'Priority', accessor: 'priority', align: 'center' as const },
  { header: 'Scheduled', accessor: 'scheduledDate' },
  { header: 'Status', accessor: 'status', align: 'center' as const },
  { header: 'Actions', accessor: 'id', align: 'center' as const },
];

export const ASSET_HISTORY_COLUMNS = [
  { header: 'Order #', accessor: 'orderNumber', width: '110px' },
  { header: 'Job Title', accessor: 'title' },
  { header: 'Equipment / Asset', accessor: 'asset' },
  { header: 'Technician', accessor: 'technician' },
  { header: 'Completed Date', accessor: 'completedAt' },
  { header: 'Status', accessor: 'status', align: 'center' as const },
  { header: 'Actions', accessor: 'id', align: 'center' as const },
];
