import { useState, useEffect, type FC, type KeyboardEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, Calendar, Clock, UserCheck, Wrench, Building2 } from 'lucide-react';
import { Button, Input, Select, Textarea, PrioritySelector } from '../components/ui';
import { SubpageHeader } from '../components/navigation';
import { getCustomers, getCustomerById, type CustomerResponse } from '../services/customerService';
import { getTechnicians, type TechnicianUser } from '../services/authService';
import {
  createWorkOrder,
  getWorkOrderById,
  updateWorkOrder,
  type CreateWorkOrderDTO,
} from '../services/workOrderService';
import type { Asset } from '../services/assetService';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface CreateWorkOrderFormData {
  title: string;
  customerId: string;
  assetId: string;
  technicianId: string;
  priority: WorkOrderPriority;
  scheduledDate: string;
  scheduledTime: string;
  description?: string;
}

export const CreateWorkOrderPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianUser[]>([]);

  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateWorkOrderFormData>({
    defaultValues: {
      title: '',
      customerId: initialCustomerId,
      assetId: '',
      technicianId: '',
      priority: 'MEDIUM',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '09:00',
      description: '',
    },
  });

  const selectedCustomerId = watch('customerId');

  const loadCustomerAssets = async (cId: string, defaultAssetId?: string) => {
    if (!cId) {
      setAssets([]);
      setValue('assetId', '');
      return;
    }

    try {
      const customerData = await getCustomerById(cId);
      const customerAssets = customerData.assets || [];
      setAssets(customerAssets);
      if (defaultAssetId) {
        setValue('assetId', defaultAssetId);
      } else if (customerAssets.length > 0) {
        setValue('assetId', customerAssets[0].id);
      } else {
        setValue('assetId', '');
      }
    } catch {
      setAssets([]);
      setValue('assetId', '');
    }
  };

  useEffect(() => {
    const fetchDependenciesAndOrder = async () => {
      try {
        const [customersData, techniciansData] = await Promise.all([
          getCustomers(),
          getTechnicians().catch(() => []),
        ]);
        setCustomers(customersData);
        setTechnicians(techniciansData);

        if (isEditMode && id) {
          setIsLoadingOrder(true);
          const existingOrder = await getWorkOrderById(id);
          setValue('title', existingOrder.title);
          setValue('customerId', existingOrder.customerId);
          setValue('technicianId', existingOrder.technicianId || '');
          setValue('priority', existingOrder.priority);
          setValue('scheduledDate', existingOrder.scheduledDate);
          setValue('scheduledTime', existingOrder.scheduledTime || '09:00');
          setValue('description', existingOrder.description || '');

          if (existingOrder.checklistItems && existingOrder.checklistItems.length > 0) {
            setChecklistItems(existingOrder.checklistItems.map((item) => item.taskDescription));
          }

          await loadCustomerAssets(existingOrder.customerId, existingOrder.assetId);
        } else if (initialCustomerId) {
          setValue('customerId', initialCustomerId);
          loadCustomerAssets(initialCustomerId);
        }
      } catch (err: any) {
        setErrorMessage('Failed to load initial data. Please refresh.');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchDependenciesAndOrder();
  }, [id, isEditMode, initialCustomerId, setValue]);

  const handleCustomerChange = (cId: string) => {
    setValue('customerId', cId);
    loadCustomerAssets(cId);
  };

  const handleAddChecklistItem = () => {
    const trimmed = newChecklistText.trim();
    if (!trimmed) return;
    setChecklistItems((prev) => [...prev, trimmed]);
    setNewChecklistText('');
  };

  const handleChecklistKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddChecklistItem();
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CreateWorkOrderFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateWorkOrderDTO = {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      customerId: data.customerId,
      assetId: data.assetId,
      technicianId: data.technicianId || null,
      priority: data.priority,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime || undefined,
      checklistItems: checklistItems.filter((item) => item.trim().length > 0),
    };

    try {
      if (isEditMode && id) {
        await updateWorkOrder(id, payload);
      } else {
        await createWorkOrder(payload);
      }
      navigate('/work-orders');
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Failed to save work order. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Work Order' : 'Create Work Order';

  return (
    <div className='min-h-screen md:min-h-0 bg-white md:bg-transparent flex flex-col font-sans pb-14 md:pb-2'>
      <SubpageHeader
        title={pageTitle}
        backPath='/work-orders'
        className='block md:hidden sticky top-0 z-30'
      />

      <div className='flex-1 w-full mx-auto px-4 py-2 pb-2 md:py-6'>
        <div className='hidden md:flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-xl font-black text-slate-900 tracking-tight'>{pageTitle}</h1>
            <p className='text-xs text-slate-500'>
              {isEditMode
                ? 'Update work order details, technician dispatch, and checklist steps.'
                : 'Assign technicians, link customer equipment, and specify inspection checklists.'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className='mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 shadow-2xs'>
            <AlertCircle className='w-4 h-4 shrink-0 text-[#D12026]' />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-5 bg-white p-2 md:p-6 rounded-2xl md:border border-slate-200 shadow-2xs'
        >
          <div className='space-y-4'>
            <div className='flex items-center gap-2 pb-2 border-b border-slate-100'>
              <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
                <Wrench className='w-3.5 h-3.5 stroke-[2.2]' />
              </div>
              <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>Job Overview</h2>
            </div>

            <Input
              id='title'
              label='Work Order Title'
              required
              placeholder='e.g. Annual Compressor Diagnostic & Filter Change'
              error={errors.title ? 'Work Order Title is required' : undefined}
              {...register('title', { required: true })}
            />
          </div>

          <div className='space-y-4 pt-2'>
            <div className='flex items-center gap-2 pb-2 border-b border-slate-100'>
              <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
                <Building2 className='w-3.5 h-3.5 stroke-[2.2]' />
              </div>
              <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>Customer & Asset</h2>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <Controller
                name='customerId'
                control={control}
                rules={{ required: true }}
                render={({ field: { value } }) => (
                  <Select
                    id='customerId'
                    label='Customer / Client'
                    required
                    value={value}
                    leftIcon={<Building2 className='w-4 h-4 text-slate-400' />}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    error={errors.customerId ? 'Customer is required' : undefined}
                    options={customers.map((c) => ({
                      value: c.id,
                      label: c.name,
                      subLabel: `${c.phone} ${c.contactPerson ? `• ${c.contactPerson}` : ''}`,
                      icon: <Building2 className='w-4 h-4 text-slate-500' />,
                    }))}
                  />
                )}
              />

              <div>
                <Controller
                  name='assetId'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      id='assetId'
                      label='Asset / Equipment'
                      required
                      disabled={assets.length === 0}
                      value={value}
                      onChange={onChange}
                      leftIcon={<Wrench className='w-4 h-4 text-slate-400' />}
                      error={errors.assetId ? 'Equipment is required' : undefined}
                      options={
                        assets.length > 0
                          ? assets.map((a) => ({
                              value: a.id,
                              label: a.machineName,
                              subLabel: `${a.machineType} • ${a.modelName || 'General'} ${a.serialNumber ? `• SN: ${a.serialNumber}` : ''}`,
                              image: a.imageUrl || undefined,
                              icon: !a.imageUrl ? <Wrench className='w-4 h-4 text-slate-500' /> : undefined,
                            }))
                          : [{ value: '', label: selectedCustomerId ? 'No equipment registered' : 'Select a customer first' }]
                      }
                    />
                  )}
                />
                {selectedCustomerId && assets.length === 0 && (
                  <p className='text-[10px] text-slate-400 mt-1'>
                    No registered assets found for this customer account.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-4 pt-2'>
            <div className='flex items-center gap-2 pb-2 border-b border-slate-100'>
              <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
                <UserCheck className='w-3.5 h-3.5 stroke-[2.2]' />
              </div>
              <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>Schedule & Dispatch</h2>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <Controller
                name='technicianId'
                control={control}
                rules={{ required: true }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    id='technicianId'
                    label='Assign Technician'
                    required
                    value={value}
                    leftIcon={<UserCheck className='w-4 h-4 text-slate-400' />}
                    onChange={onChange}
                    error={errors.technicianId ? 'Technician is required' : undefined}
                    options={[
                      { value: '', label: 'Select Technician' },
                      ...technicians.map((t) => ({
                        value: t.id,
                        label: t.name,
                        subLabel: t.phone ? `${t.phone} • ${t.email}` : t.email,
                        icon: <UserCheck className='w-4 h-4 text-slate-500' />,
                      })),
                    ]}
                  />
                )}
              />

              <Input
                id='scheduledDate'
                type='date'
                label='Scheduled Date'
                leftIcon={<Calendar className='w-4 h-4' />}
                required
                error={errors.scheduledDate ? 'Scheduled Date is required' : undefined}
                {...register('scheduledDate', { required: true })}
              />

              <Input
                id='scheduledTime'
                type='time'
                label='Preferred Time'
                leftIcon={<Clock className='w-4 h-4' />}
                {...register('scheduledTime')}
              />
            </div>
          </div>

          <div className='pt-2'>
            <Controller
              name='priority'
              control={control}
              render={({ field: { value, onChange } }) => (
                <PrioritySelector
                  label='Priority Level'
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>

          <div className='space-y-2 pt-2'>
            <Textarea
              id='description'
              label='Work Scope & Instructions'
              rows={3}
              placeholder='Instructions, access details, site safety requirements, or technician tools needed...'
              {...register('description')}
            />
          </div>

          <div className='space-y-3 pt-3 border-t border-slate-100'>
            <div className='flex items-center justify-between'>
              <label className='block text-xs font-bold text-slate-800'>Inspection Checklist Steps</label>
              <span className='text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full'>
                {checklistItems.length} Step{checklistItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className='flex items-center gap-2'>
              <div className='flex-1'>
                <Input
                  placeholder='Add checklist step (e.g. Test emergency shutoff switch)...'
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={handleChecklistKeyDown}
                />
              </div>
              <Button
                type='button'
                variant='secondary'
                onClick={handleAddChecklistItem}
                leftIcon={<Plus className='w-3.5 h-3.5' />}
                className='px-4 py-3 rounded-xl text-xs font-bold shrink-0'
              >
                Add Step
              </Button>
            </div>

            {checklistItems.length > 0 && (
              <div className='space-y-2 max-h-56 overflow-y-auto pt-1 pr-0.5'>
                {checklistItems.map((item, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs gap-3 group transition-all hover:bg-slate-100/70'
                  >
                    <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                      <span className='w-5 h-5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs'>
                        {idx + 1}
                      </span>
                      <span className='text-xs font-medium text-slate-800 truncate'>{item}</span>
                    </div>

                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveChecklistItem(idx)}
                      title='Remove checklist step'
                      leftIcon={<Trash2 className='w-3.5 h-3.5' />}
                      className='p-1.5 h-auto text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 border-0 shadow-none'
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='pt-3'>
            <Button
              type='submit'
              fullWidth
              isLoading={isSubmitting || isLoadingOrder}
              className='py-3.5 px-4 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] text-white font-bold text-sm tracking-wide shadow-md transition-all border-0 cursor-pointer'
            >
              {isEditMode ? 'Update Work Order' : 'Create & Dispatch Work Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkOrderPage;
