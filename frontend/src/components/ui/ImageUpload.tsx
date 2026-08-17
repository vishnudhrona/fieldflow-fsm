import { useState, useRef, useEffect, type FC, type ReactNode, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ImageFileItem {
  id: string;
  url: string;
  name: string;
  isUploading?: boolean;
}

export interface ImageUploadProps {
  value?: string | string[];
  onUpload: (file: File) => Promise<string>;
  onRemove?: (url: string) => Promise<void> | void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  label?: ReactNode;
  subLabel?: ReactNode;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  containerClassName?: string;
}

export const ImageUpload: FC<ImageUploadProps> = ({
  value,
  onUpload,
  onRemove,
  multiple = false,
  maxFiles = multiple ? 5 : 1,
  maxSizeMB = 10,
  label,
  subLabel,
  helperText,
  error: propError,
  required,
  disabled,
  id = 'image-upload',
  containerClassName,
}) => {
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      const urls = Array.isArray(value) ? value : value ? [value] : [];
      setItems(urls.map((url, i) => ({ id: `img-${i}`, url, name: `Photo ${i + 1}` })));
    }
  }, [value]);

  const handleFiles = async (files: File[]) => {
    if (disabled || files.length === 0) return;
    setError(null);

    const availableSlots = maxFiles - items.length;
    if (availableSlots <= 0) {
      setError(`Maximum ${maxFiles} photo${maxFiles > 1 ? 's' : ''} allowed.`);
      return;
    }

    const selected = files.slice(0, availableSlots);

    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed (PNG, JPG, WebP).');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Image must be smaller than ${maxSizeMB}MB.`);
        return;
      }
    }

    for (const file of selected) {
      const tempId = `${Date.now()}-${Math.random()}`;
      const tempItem: ImageFileItem = {
        id: tempId,
        url: '',
        name: file.name,
        isUploading: true,
      };

      setItems((prev) => [...prev, tempItem]);

      try {
        const s3Url = await onUpload(file);
        setItems((prev) =>
          prev.map((it) => (it.id === tempId ? { ...it, url: s3Url, isUploading: false } : it))
        );
      } catch (err: any) {
        setError(err?.message || 'Failed to upload image to S3');
        setItems((prev) => prev.filter((it) => it.id !== tempId));
      }
    }
  };

  const removeImage = async (idx: number) => {
    const item = items[idx];
    if (item?.url && onRemove) {
      try {
        await onRemove(item.url);
      } catch (err) {
        console.error('Failed to remove image from S3:', err);
      }
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const isMaxReached = items.length >= maxFiles;
  const isUploading = items.some((it) => it.isUploading);
  const activeError = propError || error;

  return (
    <div className={cn('w-full space-y-2', containerClassName)}>
      <div className='flex items-center justify-between'>
        {(label || subLabel) && (
          <label htmlFor={id} className='block text-xs font-bold text-slate-800'>
            {label}
            {required && <span className='text-[#D12026] ml-0.5'>*</span>}
            {subLabel && <span className='text-slate-400 font-normal ml-1.5'>{subLabel}</span>}
          </label>
        )}
        {maxFiles > 1 && (
          <span className='text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full'>
            {items.length} / {maxFiles} Uploaded
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type='file'
        accept='image/*'
        multiple={multiple}
        disabled={disabled || isMaxReached || isUploading}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          handleFiles(Array.from(e.target.files || []));
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className='hidden'
      />

      {!isMaxReached && (
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(Array.from(e.dataTransfer.files || []));
          }}
          className={cn(
            'border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center select-none',
            isDragOver ? 'border-[#D12026] bg-rose-50/40' : 'border-slate-200 hover:border-[#D12026]/60 bg-slate-50/50',
            (disabled || isUploading) && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          <div className='w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400'>
            {isUploading ? <Loader2 className='w-5 h-5 animate-spin text-[#D12026]' /> : <UploadCloud className='w-5 h-5' />}
          </div>
          <div>
            <p className='text-xs font-bold text-slate-800'>
              {items.length === 0 ? 'Click or drag photos to upload' : '+ Add Photo'}
            </p>
            <p className='text-[10px] text-slate-400'>
              Upload up to {maxFiles} photo{maxFiles > 1 ? 's' : ''} (Max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className={cn('grid gap-2.5 pt-1', items.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
          {items.map((img, idx) => (
            <div key={img.id} className='flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs gap-2'>
              <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                <div className='relative w-11 h-11 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0'>
                  {img.url ? (
                    <img src={img.url} alt={img.name} className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full bg-slate-100 flex items-center justify-center'>
                      <Loader2 className='w-4 h-4 text-[#D12026] animate-spin' />
                    </div>
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-xs font-bold text-slate-900 truncate'>{img.name}</p>
                  <p className='text-[10px] text-slate-400'>{img.isUploading ? 'Uploading to S3...' : 'Stored in S3'}</p>
                </div>
              </div>

              {!disabled && !img.isUploading && (
                <button
                  type='button'
                  onClick={() => removeImage(idx)}
                  className='p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer'
                  title='Delete photo from S3'
                >
                  <X className='w-4 h-4' />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {activeError ? (
        <p className='text-[11px] text-[#D12026] font-semibold flex items-center gap-1.5'>
          <AlertCircle className='w-3.5 h-3.5 shrink-0' />
          <span>{activeError}</span>
        </p>
      ) : helperText ? (
        <p className='text-xs text-slate-500'>{helperText}</p>
      ) : null}
    </div>
  );
};

export default ImageUpload;
