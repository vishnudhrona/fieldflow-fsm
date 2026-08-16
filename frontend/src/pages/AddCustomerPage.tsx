import { useState, useEffect, type FC } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button, Input, Textarea, Toggle } from '../components/ui';
import { SubpageHeader } from '../components/navigation';
import { createCustomer, getCustomerById, updateCustomer } from '../services/customerService';

export interface AddCustomerFormData {
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  status: boolean;
}

export const AddCustomerPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddCustomerFormData>({
    defaultValues: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
      status: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchCustomerDetails = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const customer = await getCustomerById(id);
        reset({
          name: customer.name,
          contactPerson: customer.contactPerson || '',
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes || '',
          status: customer.status,
        });
      } catch (err: any) {
        console.error('Failed to load customer details:', err);
        setErrorMessage(err?.response?.data?.message || 'Failed to load customer data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerDetails();
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: AddCustomerFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (isEditMode && id) {
        await updateCustomer(id, data);
      } else {
        await createCustomer(data);
      }
      navigate('/customers');
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      setErrorMessage(
        err?.response?.data?.message ||
          (isEditMode ? 'Failed to update customer.' : 'Failed to create customer.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Customer' : 'Add Customer';
  const pageSubtitle = isEditMode
    ? 'Update client profile, contacts, and site address'
    : 'Create a new client profile and site address';
  const submitButtonText = isEditMode ? 'Update Customer' : 'Save Customer';

  if (isLoading) {
    return (
      <div className='min-h-screen md:min-h-0 flex flex-col items-center justify-center py-20 text-slate-500 gap-3'>
        <Loader2 className='w-8 h-8 animate-spin text-[#D12026]' />
        <span className='text-xs font-semibold'>Loading customer details...</span>
      </div>
    );
  }

  return (
    <div className='min-h-screen md:min-h-0 bg-white md:bg-transparent flex flex-col'>
      <SubpageHeader title={pageTitle} backPath='/customers' className='block md:hidden sticky top-0 z-30' />

      <div className='flex-1 w-full mx-auto px-4 py-2'>
        <div className='hidden md:flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-xl font-black text-slate-900 tracking-tight'>{pageTitle}</h1>
            <p className='text-xs text-slate-500'>{pageSubtitle}</p>
          </div>
        </div>

        {errorMessage && (
          <div className='mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold'>
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4 bg-white p-2 sm:p-4 rounded-xl md:border border-slate-200 shadow-xs'
        >
          <Input
            id='name'
            label='Customer Name'
            required
            placeholder='Enter customer name'
            error={errors.name ? 'Customer Name is required' : undefined}
            {...register('name', { required: true })}
          />

          <Input
            id='contactPerson'
            label='Contact Person'
            placeholder='Enter contact person'
            {...register('contactPerson')}
          />

          <Input
            id='phone'
            type='tel'
            label='Phone Number'
            required
            placeholder='Enter phone number'
            error={errors.phone ? 'Phone Number is required' : undefined}
            {...register('phone', { required: true })}
          />

          <Input
            id='email'
            type='email'
            label='Email'
            required
            placeholder='Enter email address'
            error={errors.email ? (errors.email.message || 'Email is required') : undefined}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address',
              },
            })}
          />

          <Textarea
            id='address'
            label='Service Address'
            required
            rows={3}
            placeholder='Enter full address'
            error={errors.address ? 'Service Address is required' : undefined}
            {...register('address', { required: true })}
          />

          <Input
            id='notes'
            label='Notes'
            placeholder='Additional notes (optional)'
            {...register('notes')}
          />

          <Controller
            name='status'
            control={control}
            render={({ field: { value, onChange } }) => (
              <Toggle
                label='Customer Status'
                description={value ? 'Active (Customer is Active)' : 'Inactive (Customer is Inactive)'}
                checked={value}
                onChange={onChange}
                color='rose'
              />
            )}
          />

          <div className='pt-3'>
            <Button
              type='submit'
              fullWidth
              isLoading={isSubmitting}
              className='py-3.5 px-4 rounded-xl bg-[#D12026] hover:bg-[#B11A1F] active:bg-[#911519] text-white font-bold text-sm tracking-wide shadow-md transition-all border-0 cursor-pointer'
            >
              {submitButtonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerPage;
