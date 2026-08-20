import { useState, useEffect, type FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, UserCheck, Edit, Play, X, XCircle, RefreshCw } from 'lucide-react';
import { Button, StatusBadge } from '../components/ui';
import { SubpageHeader } from '../components/navigation';
import {
  ServiceChecklistCard,
  PhotosAttachmentsCard,
  FieldNotesCard,
  ServiceReadingsCard,
  AuditTrailCard,
} from '../components/work-orders';
import {
  getWorkOrderById,
  updateWorkOrderStatus,
  toggleChecklistItem,
  addWorkOrderNote,
  addWorkOrderReading,
  type WorkOrder,
  type WorkOrderStatus,
  type WorkOrderNoteItem,
  type WorkOrderReadingItem,
} from '../services/workOrderService';
import { type WorkOrderAttachment } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { photoSyncEngine } from '../services/photoSyncEngine';
import { Can } from '../components/auth';
import { UserRole } from '../services/authService';

export const WorkOrderDetailsPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    isSyncing,
    syncNow,
    mutations,
    queuePhoto,
    retryPhoto,
    photoPendingCount,
    deletePhoto,
  } = useSync();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('PSI');

  const [attachments, setAttachments] = useState<WorkOrderAttachment[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pendingNotes = mutations.filter((m) => m.workOrderId === id && m.actionType === 'ADD_NOTE');
  const pendingReadings = mutations.filter((m) => m.workOrderId === id && m.actionType === 'ADD_READING');
  const hasNoteError = pendingNotes.some((m) => m.status === 'FAILED');
  const hasReadingError = pendingReadings.some((m) => m.status === 'FAILED');
  const totalWorkOrderFailed = mutations.some((m) => m.workOrderId === id && m.status === 'FAILED');

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const order = await getWorkOrderById(id);
        setWorkOrder(order);
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load work order details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchPhotos = async () => {
      const list = await photoSyncEngine.getPhotosForWorkOrder(id, workOrder?.attachments);
      setAttachments(list);
    };
    fetchPhotos();
  }, [id, isSyncing, photoPendingCount, workOrder?.attachments]);

  const handleToggleChecklist = async (checklistId: string, currentStatus: boolean) => {
    if (!id || !workOrder) return;
    const newStatus = !currentStatus;

    setWorkOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checklistItems: prev.checklistItems?.map((item) =>
          item.id === checklistId
            ? { ...item, isCompleted: newStatus, completedAt: newStatus ? new Date().toISOString() : null }
            : item,
        ),
      };
    });

    await toggleChecklistItem(id, checklistId, newStatus);
  };

  const handleAddReading = async () => {
    if (!id || !metricName.trim() || !metricValue.trim()) return;

    const metric = metricName.trim();
    const value = metricValue.trim();
    const unit = metricUnit.trim();

    setMetricName('');
    setMetricValue('');

    const authorId = user?.id ? String(user.id) : undefined;
    const authorName = user?.name || 'Technician';

    const saved = await addWorkOrderReading(id, metric, value, unit, {
      id: authorId,
      name: authorName,
    });

    const newReadingItem: WorkOrderReadingItem = {
      id: saved.id,
      workOrderId: id,
      userId: authorId || null,
      metric,
      value,
      unit,
      recordedAt: new Date().toISOString(),
      technician: {
        id: authorId || '',
        name: authorName,
        email: user?.email || '',
      },
      createdAt: new Date().toISOString(),
    };

    setWorkOrder((prev) => (prev ? { ...prev, readings: [newReadingItem, ...(prev.readings || [])] } : prev));
  };

  const handleQueuePhoto = async (file: File) => {
    if (!id) return;
    try {
      const record = await queuePhoto(id, file);
      setAttachments((prev) => [record, ...prev]);
    } catch (err: any) {
      alert(err?.message || 'Failed to capture image');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!id) return;
    await deletePhoto(photoId);
    setAttachments((prev) => prev.filter((a) => a.id !== photoId));
  };

  const handleRetryPhoto = async (photoId: string) => {
    if (!id) return;
    await retryPhoto(photoId);
  };

  const handleAddNote = async () => {
    if (!id || !newNoteText.trim()) return;
    const text = newNoteText.trim();
    setNewNoteText('');

    const authorId = user?.id ? String(user.id) : undefined;
    const authorName = user?.name || 'User';

    const saved = await addWorkOrderNote(id, text, { id: authorId || '', name: authorName });

    setWorkOrder((prev) => {
      if (!prev) return prev;
      const newNoteItem: WorkOrderNoteItem = {
        id: saved.id,
        workOrderId: id,
        userId: authorId || null,
        content: text,
        type: 'NOTE',
        createdAt: new Date().toISOString(),
        user: {
          id: authorId || '',
          name: authorName,
          email: user?.email || '',
          role: (user?.role as any) || 'ADMIN_DISPATCHER',
        },
      };
      return {
        ...prev,
        notes: [newNoteItem, ...(prev.notes || [])],
      };
    });
  };

  const handleStatusTransition = async (targetStatus: WorkOrderStatus) => {
    if (!id || !workOrder || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      setWorkOrder((prev) => (prev ? { ...prev, status: targetStatus, _syncStatus: 'PENDING_SYNC' } : prev));
      await updateWorkOrderStatus(id, targetStatus);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update job status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500'>
        <div className='w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D12026] shadow-xs'>
          <RefreshCw className='w-6 h-6 animate-spin stroke-[2.2]' />
        </div>
        <p className='text-xs font-semibold text-slate-500'>Loading work order details...</p>
      </div>
    );
  }

  if (errorMessage || !workOrder) {
    return (
      <div className='p-6 max-w-xl mx-auto text-center space-y-4 pt-16'>
        <div className='w-12 h-12 rounded-2xl bg-rose-50 text-[#D12026] flex items-center justify-center mx-auto shadow-2xs'>
          <AlertCircle className='w-6 h-6' />
        </div>
        <h2 className='text-base font-black text-slate-900'>Work Order Not Found</h2>
        <p className='text-xs text-slate-500'>{errorMessage || 'Unable to resolve job details.'}</p>
        <Button size='sm' onClick={() => navigate('/work-orders')} className='bg-[#D12026] text-white border-0'>
          Back to Work Orders
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col min-h-screen bg-slate-50/60 font-sans pb-24 md:pb-12'>
      <SubpageHeader
        title={workOrder.orderNumber}
        backPath='/work-orders'
        className='block md:hidden sticky top-0 z-30 shadow-2xs'
        actionItems={[
          {
            id: 'edit',
            label: 'Edit Work Order',
            icon: Edit,
            onClick: () => navigate(`/work-orders/edit/${id}`),
          },
        ]}
      />

      <div className='w-full mx-auto px-4 md:px-6 py-6 md:py-6 space-y-5'>
        {isSyncing && (pendingNotes.length > 0 || pendingReadings.length > 0 || totalWorkOrderFailed) && (
          <div className='flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 shadow-2xs animate-pulse'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0'>
                <RefreshCw className='w-4 h-4 animate-spin' />
              </div>
              <div>
                <h4 className='text-xs font-black text-amber-950'>Syncing Offline Changes</h4>
                <p className='text-[11px] text-amber-800 font-medium'>
                  Uploading field notes and service readings to server database...
                </p>
              </div>
            </div>
          </div>
        )}

        {!isSyncing && totalWorkOrderFailed && (
          <div className='flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-2xs'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0'>
                <AlertCircle className='w-4 h-4 text-rose-600' />
              </div>
              <div>
                <h4 className='text-xs font-black text-rose-950'>Offline Sync Incomplete</h4>
                <p className='text-[11px] text-rose-800 font-medium'>
                  Some changes could not be saved to the cloud database.
                </p>
              </div>
            </div>
            <Button
              size='sm'
              variant='danger'
              onClick={syncNow}
              className='py-2 px-3 text-xs font-bold shrink-0 shadow-xs'
              leftIcon={<RefreshCw className='w-3.5 h-3.5' />}
            >
              Retry Sync
            </Button>
          </div>
        )}

        <div className='flex md:hidden items-center justify-between gap-2 flex-wrap pb-1'>
          <div className='flex items-center gap-2 flex-wrap'>
            <StatusBadge status={workOrder.status} size='sm' rounded='full' />
            <StatusBadge status={workOrder.priority} size='sm' rounded='full' />
          </div>

          {workOrder._syncStatus === 'PENDING_SYNC' && (
            <span className='flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'>
              <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
              Pending Cloud Sync
            </span>
          )}
        </div>

        {workOrder.status === 'COMPLETED' && (
          <div className='flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-2xs'>
            <div className='w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs'>
              <CheckCircle2 className='w-4 h-4 stroke-[2.5]' />
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-2'>
                <span>Job Completed</span>
                {workOrder.completedAt && (
                  <span className='text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md'>
                    {new Date(workOrder.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                    {new Date(workOrder.completedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </h3>
              <p className='text-[11px] sm:text-xs text-emerald-700 font-medium truncate'>
                All service checklist tasks, readings, and notes have been finalized.
              </p>
            </div>
          </div>
        )}

        <div className='hidden md:block space-y-3'>
          <div className='flex items-center justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-black text-slate-900 tracking-tight font-mono'>{workOrder.orderNumber}</h1>

              <StatusBadge status={workOrder.status} size='sm' rounded='full' />
              <StatusBadge status={workOrder.priority} size='sm' rounded='full' />

              {workOrder._syncStatus === 'PENDING_SYNC' && (
                <span className='flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'>
                  <span className='w-1.5 h-1.5 rounded-full bg-amber-500' />
                  Pending Cloud Sync
                </span>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Can roles={UserRole.ADMIN_DISPATCHER}>
                {workOrder.status !== 'CANCELLED' && workOrder.status !== 'COMPLETED' && (
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this work order?')) {
                        handleStatusTransition('CANCELLED');
                      }
                    }}
                    isLoading={isUpdatingStatus}
                    leftIcon={<XCircle className='w-3.5 h-3.5' />}
                  >
                    Cancel Work Order
                  </Button>
                )}

                {workOrder.status === 'CANCELLED' && (
                  <div className='flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs'>
                    <XCircle className='w-4 h-4 text-rose-600' />
                    <span>Work Order Cancelled</span>
                  </div>
                )}

                {workOrder.status === 'COMPLETED' && (
                  <div className='flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                    <span>Job Completed</span>
                  </div>
                )}
              </Can>

              <Can roles={UserRole.TECHNICIAN}>
                {workOrder.status === 'NEW' && (
                  <Button
                    onClick={() => handleStatusTransition('PENDING')}
                    isLoading={isUpdatingStatus}
                    leftIcon={<CheckCircle2 className='w-3.5 h-3.5' />}
                    className='bg-blue-600 hover:bg-blue-700 text-white shadow-xs border-0'
                  >
                    Accept Job
                  </Button>
                )}

                {workOrder.status === 'PENDING' && (
                  <Button
                    onClick={() => handleStatusTransition('IN_PROGRESS')}
                    isLoading={isUpdatingStatus}
                    leftIcon={<Play className='w-3.5 h-3.5' />}
                    className='bg-[#D12026] hover:bg-[#B11A1F] text-white'
                  >
                    Start Job
                  </Button>
                )}

                {workOrder.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => handleStatusTransition('COMPLETED')}
                    isLoading={isUpdatingStatus}
                    leftIcon={<CheckCircle2 className='w-4 h-4' />}
                    className='bg-[#16A34A] hover:bg-[#15803D] active:bg-[#166534] text-white shadow-xs border-0'
                  >
                    Complete Job (Offline Safe)
                  </Button>
                )}

                {workOrder.status === 'COMPLETED' && (
                  <div className='flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                    <span>Job Completed</span>
                  </div>
                )}

                {workOrder.status === 'CANCELLED' && (
                  <div className='flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs'>
                    <XCircle className='w-4 h-4 text-rose-600' />
                    <span>Work Order Cancelled</span>
                  </div>
                )}
              </Can>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-[10px] font-black uppercase tracking-wider text-[#D12026] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100'>
                  Work Order #{workOrder.orderNumber}
                </span>
                <span className='text-[10px] font-bold text-slate-400'>
                  Scheduled for {workOrder.scheduledDate} {workOrder.scheduledTime ? `at ${workOrder.scheduledTime}` : ''}
                </span>
              </div>
              <h1 className='text-lg sm:text-xl font-black text-slate-900 tracking-tight'>{workOrder.title}</h1>
            </div>

            <div className='hidden md:flex items-center gap-2'>
              <StatusBadge status={workOrder.status} size='md' rounded='full' />
              <StatusBadge status={workOrder.priority} size='md' rounded='full' />
            </div>
          </div>

          <div className='pt-2 border-t border-slate-100'>
            <p className='text-xs sm:text-sm text-slate-600 leading-relaxed font-normal'>
              {workOrder.description || 'No specific job instructions provided.'}
            </p>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-slate-100'>
            <div className='space-y-1'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Order ID</span>
              <p className='text-sm sm:text-base font-black text-slate-900 font-mono'>{workOrder.orderNumber}</p>
            </div>

            <div className='space-y-1 lg:pl-5 pt-2 sm:pt-0'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Title</span>
              <p className='text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-2'>{workOrder.title}</p>
            </div>
            <div className='space-y-1 lg:pl-5 pt-2 sm:pt-0'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Customer</span>
              <p className='text-xs sm:text-sm font-bold text-slate-800 truncate'>
                {workOrder.customer?.name || 'Customer'}
              </p>
            </div>

            <div className='space-y-1 lg:pl-5 pt-2 sm:pt-0'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>
                Asset / Machine
              </span>
              <p className='text-xs sm:text-sm font-bold text-slate-800 truncate'>
                {workOrder.asset?.machineName || 'Equipment'}
              </p>
              <p className='text-[10px] text-slate-400 truncate'>
                {workOrder.asset?.machineType} {workOrder.asset?.modelName ? `• ${workOrder.asset.modelName}` : ''}
              </p>
            </div>

            <div className='space-y-1 lg:pl-5 pt-2 sm:pt-0'>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-wider block'>Technician</span>
              <div className='flex items-center gap-1.5'>
                <UserCheck className='w-3.5 h-3.5 text-[#D12026] shrink-0' />
                <p className='text-xs sm:text-sm font-bold text-slate-800 truncate'>
                  {workOrder.technician?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'>
          <div className='lg:col-span-6 space-y-5'>
            <ServiceChecklistCard checklistItems={workOrder?.checklistItems} onToggleItem={handleToggleChecklist} />
            <ServiceReadingsCard
              readings={workOrder?.readings}
              metricName={metricName}
              metricValue={metricValue}
              metricUnit={metricUnit}
              onMetricNameChange={setMetricName}
              onMetricValueChange={setMetricValue}
              onMetricUnitChange={setMetricUnit}
              onAddReading={handleAddReading}
              isSyncing={isSyncing && pendingReadings.length > 0}
              pendingCount={pendingReadings.length}
              hasSyncError={hasReadingError}
              onRetrySync={syncNow}
            />
          </div>

          <div className='lg:col-span-6 space-y-5'>
            <PhotosAttachmentsCard
              attachments={attachments}
              onUploadPhoto={handleQueuePhoto}
              onDeletePhoto={handleDeletePhoto}
              onRetryPhoto={handleRetryPhoto}
              onPreviewPhoto={(url) => setSelectedImage(url)}
            />

            <FieldNotesCard
              notes={workOrder?.notes}
              newNoteText={newNoteText}
              onNoteTextChange={setNewNoteText}
              onAddNote={handleAddNote}
              isSyncing={isSyncing && pendingNotes.length > 0}
              pendingCount={pendingNotes.length}
              hasSyncError={hasNoteError}
              onRetrySync={syncNow}
            />
            <AuditTrailCard history={workOrder?.history} />
          </div>
        </div>
      </div>

      <div className='block md:hidden fixed bottom-14 left-0 right-0 px-3 py-4 z-20'>
        <Can roles={UserRole.ADMIN_DISPATCHER}>
          {workOrder.status !== 'CANCELLED' && workOrder.status !== 'COMPLETED' && (
            <Button
              fullWidth
              variant='danger'
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this work order?')) {
                  handleStatusTransition('CANCELLED');
                }
              }}
              isLoading={isUpdatingStatus}
              leftIcon={<XCircle className='w-4 h-4' />}
              className='py-3 rounded-xl text-xs font-bold'
            >
              Cancel Work Order
            </Button>
          )}
        </Can>

        <Can roles={UserRole.TECHNICIAN}>
          {workOrder.status === 'NEW' && (
            <Button
              fullWidth
              onClick={() => handleStatusTransition('PENDING')}
              isLoading={isUpdatingStatus}
              leftIcon={<CheckCircle2 className='w-4 h-4' />}
              className='bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold border-0'
            >
              Accept Job
            </Button>
          )}

          {workOrder.status === 'PENDING' && (
            <Button
              fullWidth
              onClick={() => handleStatusTransition('IN_PROGRESS')}
              isLoading={isUpdatingStatus}
              leftIcon={<Play className='w-4 h-4 fill-current' />}
              className='bg-[#D12026] hover:bg-[#B11A1F] text-white py-3 rounded-xl text-xs font-bold border-0'
            >
              Start Job
            </Button>
          )}

          {workOrder.status === 'IN_PROGRESS' && (
            <Button
              fullWidth
              onClick={() => handleStatusTransition('COMPLETED')}
              isLoading={isUpdatingStatus}
              leftIcon={<CheckCircle2 className='w-4 h-4' />}
              className='bg-[#16A34A] hover:bg-[#15803D] text-white py-3 rounded-xl text-xs font-bold border-0'
            >
              Complete Job (Offline Safe)
            </Button>
          )}
        </Can>
      </div>

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs'
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className='max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-black shadow-2xl relative'
          >
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSelectedImage(null)}
              className='absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white hover:text-white border-0 z-10'
            >
              <X className='w-5 h-5' />
            </Button>
            <img src={selectedImage} alt='Attachment Preview' className='w-full h-full object-contain max-h-[80vh]' />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderDetailsPage;
