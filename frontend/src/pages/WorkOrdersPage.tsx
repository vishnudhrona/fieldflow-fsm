import { useState, type FC } from 'react';
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Search, 
  Plus 
} from 'lucide-react';

export const WorkOrdersPage: FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const orders = [
    {
      id: 'WO-1042',
      customer: 'Apex Logistics Hub',
      address: '742 Evergreen Terrace, Sector 4',
      service: 'HVAC Air Filter Replacement & Inspection',
      status: 'IN_PROGRESS',
      statusLabel: 'In Progress',
      statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
      priority: 'High Priority',
      time: '11:30 AM',
      scheduledDate: 'Today',
    },
    {
      id: 'WO-1043',
      customer: 'Starlight Medical Center',
      address: '108 Broadway Ave, Block B',
      service: 'Backup Power Generator Diagnostic',
      status: 'PENDING',
      statusLabel: 'Pending',
      statusClass: 'bg-blue-50 text-blue-700 border-blue-200',
      priority: 'Normal',
      time: '02:00 PM',
      scheduledDate: 'Today',
    },
    {
      id: 'WO-1044',
      customer: 'Nexus Tech Innovations',
      address: '500 Silicon Way, Suite 300',
      service: 'Fiber Optic Patch Panel Relocation',
      status: 'PENDING',
      statusLabel: 'Pending',
      statusClass: 'bg-blue-50 text-blue-700 border-blue-200',
      priority: 'Urgent',
      time: '04:30 PM',
      scheduledDate: 'Today',
    },
    {
      id: 'WO-1039',
      customer: 'GreenValley Residence',
      address: '22 Elm Street, Apt 4C',
      service: 'Smart Meter Calibration & Verification',
      status: 'COMPLETED',
      statusLabel: 'Completed',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      priority: 'Low',
      time: '09:15 AM',
      scheduledDate: 'Today',
    },
  ];

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'ALL' || order.status === filter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-black text-slate-900 tracking-tight'>Work Orders</h1>
          <p className='text-xs text-slate-500'>Track and execute assigned field tasks</p>
        </div>
        <button
          type='button'
          className='inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D12026] text-white text-xs font-bold shadow-sm hover:bg-[#B11A1F] active:scale-95 transition-all cursor-pointer'
        >
          <Plus className='w-3.5 h-3.5' />
          <span>New Order</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className='relative'>
        <Search className='w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Search work order ID, service, or customer...'
          className='w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#D12026] focus:ring-1 focus:ring-[#D12026] shadow-xs'
        />
      </div>

      {/* Filter Tabs */}
      <div className='flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar'>
        {[
          { id: 'ALL', label: 'All Orders' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'COMPLETED', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            type='button'
            onClick={() => setFilter(tab.id as any)}
            className={`
              px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer
              ${
                filter === tab.id
                  ? 'bg-[#D12026] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className='space-y-3'>
        {filteredOrders.length === 0 ? (
          <div className='bg-white rounded-2xl p-8 border border-slate-200 text-center'>
            <ClipboardList className='w-8 h-8 text-slate-300 mx-auto mb-2' />
            <p className='text-xs font-medium text-slate-500'>No work orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className='bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow'
            >
              <div className='flex items-start justify-between gap-2 mb-2'>
                <div>
                  <span className='text-[10px] font-bold font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md'>
                    {order.id}
                  </span>
                  <h3 className='font-bold text-slate-900 text-sm mt-1'>{order.customer}</h3>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${order.statusClass}`}
                >
                  {order.statusLabel}
                </span>
              </div>

              <p className='text-xs font-medium text-slate-700 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100'>
                {order.service}
              </p>

              <div className='flex items-center gap-1.5 text-slate-500 text-xs mb-3'>
                <MapPin className='w-3.5 h-3.5 text-slate-400 shrink-0' />
                <span className='truncate'>{order.address}</span>
              </div>

              <div className='flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-medium text-slate-500'>
                <span className='inline-flex items-center gap-1 text-rose-600 font-semibold'>
                  <AlertCircle className='w-3 h-3' />
                  {order.priority}
                </span>
                <span className='inline-flex items-center gap-1'>
                  <Clock className='w-3 h-3 text-slate-400' />
                  {order.scheduledDate}, {order.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkOrdersPage;
