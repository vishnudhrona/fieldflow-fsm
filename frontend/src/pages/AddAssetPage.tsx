import { useState, useEffect, type FC } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button, Input, Textarea, Toggle, ImageUpload } from '../components/ui';
import { SubpageHeader } from '../components/navigation';
import { uploadImageToS3, deleteImageFromS3 } from '../services/uploadService';
import { createAsset, getAssetById, updateAsset } from '../services/assetService';

export interface AddAssetFormData {
  machineName: string;
  machineType: string;
  modelName: string;
  serialNumber?: string;
  installationDate: string;
  notes?: string;
  status: boolean;
  imageUrl?: string;
  secondaryImageUrl?: string;
}

export const AddAssetPage: FC = () => {
  const { customerId, id } = useParams<{ customerId?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const targetCustomerId = customerId || searchParams.get('customerId');
  const navigate = useNavigate();

  const isEditMode = Boolean(id);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddAssetFormData>({
    defaultValues: {
      machineName: '',
      machineType: '',
      modelName: '',
      serialNumber: '',
      installationDate: new Date().toISOString().split('T')[0],
      notes: '',
      status: true,
      imageUrl: '',
      secondaryImageUrl: '',
    },
  });

  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchAsset = async () => {
      setIsLoading(true);
      try {
        const asset = await getAssetById(id);
        reset({
          machineName: asset.machineName,
          machineType: asset.machineType,
          modelName: asset.modelName,
          serialNumber: asset.serialNumber || '',
          installationDate: asset.installationDate
            ? new Date(asset.installationDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          notes: asset.notes || '',
          status: asset.status,
          imageUrl: asset.imageUrl || '',
          secondaryImageUrl: asset.secondaryImageUrl || '',
        });

        const urls: string[] = [];
        if (asset.imageUrl) urls.push(asset.imageUrl);
        if (asset.secondaryImageUrl) urls.push(asset.secondaryImageUrl);
        setUploadedUrls(urls);
      } catch (err: any) {
        setErrorMessage(err?.response?.data?.message || 'Failed to load asset details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAsset();
  }, [id, isEditMode, reset]);

  const handleUploadToS3 = async (file: File) => {
    const url = await uploadImageToS3(file);
    setUploadedUrls((prev) => {
      const updated = [...prev, url];
      setValue('imageUrl', updated[0] || '');
      setValue('secondaryImageUrl', updated[1] || '');
      return updated;
    });
    return url;
  };

  const handleRemoveFromS3 = async (url: string) => {
    await deleteImageFromS3(url);
    setUploadedUrls((prev) => {
      const updated = prev.filter((u) => u !== url);
      setValue('imageUrl', updated[0] || '');
      setValue('secondaryImageUrl', updated[1] || '');
      return updated;
    });
  };

  const onSubmit = async (data: AddAssetFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = {
        customerId: targetCustomerId || null,
        machineName: data.machineName,
        machineType: data.machineType,
        modelName: data.modelName,
        serialNumber: data.serialNumber || undefined,
        installationDate: data.installationDate,
        notes: data.notes || undefined,
        status: data.status,
        imageUrl: uploadedUrls[0] || undefined,
        secondaryImageUrl: uploadedUrls[1] || undefined,
      };

      if (isEditMode && id) {
        await updateAsset(id, payload);
      } else {
        await createAsset(payload);
      }

      navigate(targetCustomerId ? `/customers/${targetCustomerId}` : '/customers');
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Failed to save asset. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Asset' : 'Add Asset';
  const pageSubtitle = isEditMode
    ? 'Update registered equipment and machine specifications'
    : 'Register a new equipment, machine, or hardware asset';

  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center py-20 text-slate-500 gap-3'>
        <Loader2 className='w-8 h-8 animate-spin text-[#D12026]' />
        <span className='text-xs font-semibold'>Loading asset details...</span>
      </div>
    );
  }

  return (
    <div className='min-h-screen md:min-h-0 bg-white md:bg-transparent flex flex-col'>
      <SubpageHeader
        title={pageTitle}
        backPath={targetCustomerId ? `/customers/${targetCustomerId}` : '/customers'}
        className='block md:hidden sticky top-0 z-30'
      />

      <div className='flex-1 w-full mx-auto px-4 py-2'>
        <div className='hidden md:flex items-center justify-between mb-5'>
          <div>
            <h1 className='text-xl font-black text-slate-900 tracking-tight'>{pageTitle}</h1>
            <p className='text-xs text-slate-500'>{pageSubtitle}</p>
          </div>
        </div>

        {errorMessage && (
          <div className='mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center gap-2'>
            <AlertCircle className='w-4 h-4 shrink-0' />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4 bg-white p-2 sm:p-4 rounded-xl md:border border-slate-200 shadow-xs'
        >
          <Input
            id='machineName'
            label='Machine Name'
            required
            placeholder='e.g. Dell Latitude 5420, Industrial Chiller AC-400'
            error={errors.machineName ? 'Machine Name is required' : undefined}
            {...register('machineName', { required: true })}
          />

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Input
              id='machineType'
              label='Machine Type'
              required
              placeholder='e.g. Laptop, HVAC, Generator, Motor'
              error={errors.machineType ? 'Machine Type is required' : undefined}
              {...register('machineType', { required: true })}
            />

            <Input
              id='modelName'
              label='Model Name'
              required
              placeholder='e.g. Latitude 5420, ProBook 450'
              error={errors.modelName ? 'Model Name is required' : undefined}
              {...register('modelName', { required: true })}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Input
              id='installationDate'
              type='date'
              label='Installation Date'
              required
              error={errors.installationDate ? 'Installation Date is required' : undefined}
              {...register('installationDate', { required: true })}
            />

            <Input
              id='serialNumber'
              label='Serial Number'
              placeholder='e.g. SN-894231, DELL784521'
              {...register('serialNumber')}
            />
          </div>

          <ImageUpload
            id='asset-images'
            label='Machine / Asset Images'
            subLabel='(Upload up to 2 photos)'
            value={uploadedUrls}
            multiple
            maxFiles={2}
            maxSizeMB={5}
            onUpload={handleUploadToS3}
            onRemove={handleRemoveFromS3}
          />

          <Textarea
            id='notes'
            label='Notes & Specifications'
            rows={3}
            placeholder='Additional specifications, location within site, or servicing instructions...'
            {...register('notes')}
          />

          <Controller
            name='status'
            control={control}
            render={({ field: { value, onChange } }) => (
              <Toggle
                label='Asset Operational Status'
                description={
                  value
                    ? 'Active (Equipment is in service and operational)'
                    : 'Inactive (Equipment is under maintenance or retired)'
                }
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
              {isEditMode ? 'Update Asset' : 'Save Asset'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetPage;
