import { useState, useRef, type FC, type ChangeEvent, type DragEvent } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Trash2,
  Eye,
  Camera,
} from 'lucide-react';
import type { WorkOrderAttachment } from '../../services/db';

export interface PhotosAttachmentsCardProps {
  attachments: WorkOrderAttachment[];
  onUploadPhoto: (file: File) => Promise<void> | void;
  onDeletePhoto?: (id: string) => Promise<void> | void;
  onRetryPhoto?: (id: string) => Promise<void> | void;
  onPreviewPhoto?: (url: string) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

export const PhotosAttachmentsCard: FC<PhotosAttachmentsCardProps> = ({
  attachments = [],
  onUploadPhoto,
  onDeletePhoto,
  onRetryPhoto,
  onPreviewPhoto,
  maxFiles = 5,
  maxSizeMB = 10,
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    if (disabled || files.length === 0) return;
    setErrorMsg(null);

    const availableSlots = maxFiles - attachments.length;
    if (availableSlots <= 0) {
      setErrorMsg(`Maximum limit of ${maxFiles} photos reached.`);
      return;
    }

    const selected = files.slice(0, availableSlots);

    for (const file of selected) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files are allowed (PNG, JPG, WebP).');
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setErrorMsg(`Image "${file.name}" exceeds maximum allowed size of ${maxSizeMB}MB.`);
        return;
      }
    }

    for (const file of selected) {
      try {
        await onUploadPhoto(file);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to process image capture.');
      }
    }
  };

  const isMaxReached = attachments.length >= maxFiles;
  const pendingCount = attachments.filter((a) => a.status === 'PENDING' || a.status === 'UPLOADING').length;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Header */}
      <div className='flex items-center justify-between pb-2 border-b border-slate-100'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-[#D12026]'>
            <ImageIcon className='w-3.5 h-3.5 stroke-[2.2]' />
          </div>
          <h2 className='text-xs font-extrabold text-slate-900 uppercase tracking-wider'>
            Photos & Attachments
          </h2>
        </div>
        <div className='flex items-center gap-2'>
          {pendingCount > 0 && (
            <span className='text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1'>
              <span className='w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' />
              {pendingCount} Pending Sync
            </span>
          )}
          <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider'>
            {attachments.length} / {maxFiles} Photos
          </span>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        multiple
        disabled={disabled || isMaxReached}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          handleFiles(Array.from(e.target.files || []));
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        className='hidden'
      />

      {/* Upload Drop Zone */}
      {!isMaxReached && (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFiles(Array.from(e.dataTransfer.files || []));
          }}
          className={`border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center select-none ${
            isDragOver
              ? 'border-[#D12026] bg-rose-50/40'
              : 'border-slate-200 hover:border-[#D12026]/60 bg-slate-50/50 hover:bg-rose-50/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
        >
          <div className='w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-500'>
            <Camera className='w-4 h-4 text-[#D12026]' />
          </div>
          <div>
            <p className='text-xs font-bold text-slate-800'>
              {attachments.length === 0 ? 'Click or drag photos to capture site evidence' : '+ Add Photo / Evidence'}
            </p>
            <p className='text-[10px] text-slate-400'>
              Instant offline preview • Auto-syncs to S3 when online (Max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <p className='text-[11px] text-[#D12026] font-semibold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl'>
          {errorMsg}
        </p>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1'>
          {attachments.map((att) => {
            const displayUrl = att.previewUrl || att.url;

            return (
              <div
                key={att.id}
                className='flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs gap-2 group hover:bg-white hover:border-slate-300 transition-all'
              >
                {/* Thumbnail Preview */}
                <div
                  className='relative w-12 h-12 rounded-lg overflow-hidden bg-slate-200 border border-slate-200 shrink-0 cursor-pointer'
                  onClick={() => displayUrl && onPreviewPhoto?.(displayUrl)}
                  title='Click to enlarge'
                >
                  {displayUrl ? (
                    <img src={displayUrl} alt={att.name} className='w-full h-full object-cover' />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-slate-400'>
                      <ImageIcon className='w-5 h-5' />
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white'>
                    <Eye className='w-4 h-4' />
                  </div>
                </div>

                {/* Info & Sync Status */}
                <div className='min-w-0 flex-1 space-y-0.5'>
                  <p className='text-xs font-bold text-slate-900 truncate'>{att.name}</p>
                  <div className='flex items-center gap-1.5 flex-wrap'>
                    <span className='text-[10px] text-slate-400'>{att.timestamp}</span>
                    {att.technicianName && (
                      <span className='text-[10px] text-slate-500 font-medium truncate'>
                        • {att.technicianName}
                      </span>
                    )}

                    {/* Status Badge */}
                    {att.status === 'SYNCED' && (
                      <span className='inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md'>
                        <CheckCircle2 className='w-2.5 h-2.5' />
                        Cloud S3
                      </span>
                    )}

                    {att.status === 'PENDING' && (
                      <span className='inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md'>
                        <Clock className='w-2.5 h-2.5' />
                        Pending Sync
                      </span>
                    )}

                    {att.status === 'UPLOADING' && (
                      <span className='inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-md'>
                        <Loader2 className='w-2.5 h-2.5 animate-spin' />
                        Uploading...
                      </span>
                    )}

                    {att.status === 'FAILED' && (
                      <span
                        className='inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md'
                        title={att.errorMessage || 'Upload failed'}
                      >
                        <AlertTriangle className='w-2.5 h-2.5' />
                        Failed
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-1 shrink-0'>
                  {att.status === 'FAILED' && onRetryPhoto && (
                    <button
                      type='button'
                      onClick={() => onRetryPhoto(att.id)}
                      className='p-1 rounded-lg text-amber-600 hover:bg-amber-100/70 cursor-pointer transition-colors'
                      title='Retry upload to S3'
                    >
                      <RotateCw className='w-3.5 h-3.5' />
                    </button>
                  )}

                  {onDeletePhoto && !disabled && (
                    <button
                      type='button'
                      onClick={() => onDeletePhoto(att.id)}
                      className='p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors'
                      title='Delete photo'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PhotosAttachmentsCard;
