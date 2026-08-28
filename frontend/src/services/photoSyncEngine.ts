import api from './api';
import { localDb, type WorkOrderAttachment } from './db';
import { deleteImageFromS3 } from './uploadService';
import { syncEngine } from './syncEngine';
import { isDeviceOnline, formatTimeStr } from '../utils';

export class PhotoSyncEngine {
  private isUploading = false;

  public isDeviceOnline(): boolean {
    return isDeviceOnline();
  }

  async queuePhotoAttachment(workOrderId: string, file: File): Promise<WorkOrderAttachment> {
    const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const previewUrl = URL.createObjectURL(file);
    const timeStr = formatTimeStr();

    const wo = await localDb.workOrders.get(workOrderId);
    const record: WorkOrderAttachment = {
      id,
      workOrderId,
      orderNumber: wo?.orderNumber,
      name: file.name || 'Job Site Capture',
      size: file.size,
      mimeType: file.type || 'image/jpeg',
      blob: file,
      previewUrl,
      status: 'PENDING',
      retryCount: 0,
      timestamp: timeStr,
      createdAt: Date.now(),
    };

    await localDb.attachments.put(record);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fsm:photo_queue_updated', { detail: { workOrderId, attachment: record } }));
    }

    if (this.isDeviceOnline()) {
      this.processPhotoQueue().catch(() => {});
    }

    return record;
  }

  async processPhotoQueue(): Promise<{ uploaded: number; failed: number }> {
    if (this.isUploading || !this.isDeviceOnline()) {
      return { uploaded: 0, failed: 0 };
    }

    this.isUploading = true;
    let uploadedCount = 0;
    let failedCount = 0;

    try {
      const pendingPhotos = await localDb.attachments
        .filter((a) => a.status === 'PENDING')
        .toArray();
      pendingPhotos.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      if (pendingPhotos.length === 0) {
        return { uploaded: 0, failed: 0 };
      }

      for (const photo of pendingPhotos) {
        if (!this.isDeviceOnline()) break;
        if (!photo.blob) {
          if (photo.url) {
            photo.status = 'SYNCED';
            await localDb.attachments.put(photo);
          }
          continue;
        }

        photo.status = 'UPLOADING';
        await localDb.attachments.put(photo);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fsm:photo_queue_updated', { detail: { workOrderId: photo.workOrderId, attachment: photo } }));
        }

        try {
          const formData = new FormData();
          if (photo.blob) {
            const fileBlob = photo.blob instanceof File
              ? photo.blob
              : new File([photo.blob], photo.name || 'capture.jpg', { type: photo.mimeType || 'image/jpeg' });
            formData.append('file', fileBlob, photo.name || 'capture.jpg');
          }
          formData.append('client_local_id', photo.id);
          formData.append('file_name', photo.name || 'capture.jpg');
          if (photo.mimeType) formData.append('mime_type', photo.mimeType);
          if (photo.size) formData.append('file_size', String(photo.size));

          const res = await api.post<{
            success: boolean;
            attachment: {
              id: string;
              fileUrl: string;
              technicianId?: string | null;
              technician?: { id: string; name: string; email: string };
            };
          }>(`/work-orders/${photo.workOrderId}/attachments`, formData, {
            headers: {
              'X-Idempotency-Key': photo.id,
            },
          });

          const serverUrl = res.data.attachment?.fileUrl || photo.url;
          const serverId = res.data.attachment?.id;
          photo.url = serverUrl;
          photo.previewUrl = serverUrl;
          photo.serverAttachmentId = serverId;
          photo.technicianId = res.data.attachment?.technicianId || res.data.attachment?.technician?.id || null;
          photo.technicianName = res.data.attachment?.technician?.name || null;
          photo.status = 'SYNCED';
          photo.errorMessage = undefined;
          await localDb.attachments.put(photo);

          // Update cached local work order attachments
          const wo = await localDb.workOrders.get(photo.workOrderId);
          if (wo) {
            const currentAttachments = wo.attachments || [];
            const nowIso = new Date().toISOString();
            const newAtt = {
              id: serverId || photo.id,
              workOrderId: photo.workOrderId,
              fileUrl: serverUrl || photo.url || '',
              fileName: photo.name,
              fileSize: photo.size,
              mimeType: photo.mimeType,
              technicianId: photo.technicianId,
              technician: photo.technicianName ? { id: photo.technicianId || '', name: photo.technicianName, email: '' } : undefined,
              createdAt: nowIso,
              updatedAt: nowIso,
            };
            const alreadyPresent = currentAttachments.some(
              (a: any) => a.id === newAtt.id || a.fileUrl === serverUrl
            );
            if (!alreadyPresent) {
              wo.attachments = [newAtt, ...currentAttachments];
              await localDb.workOrders.put(wo);
            }
          }

          uploadedCount++;
        } catch (err: any) {
          photo.status = 'FAILED';
          photo.retryCount = (photo.retryCount || 0) + 1;
          photo.errorMessage = err?.response?.data?.message || err?.message || 'Upload failed';
          await localDb.attachments.put(photo);
          failedCount++;
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fsm:photo_queue_updated', { detail: { workOrderId: photo.workOrderId, attachment: photo } }));
        }
      }
    } finally {
      this.isUploading = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fsm:photo_sync_completed'));
      }
    }

    return { uploaded: uploadedCount, failed: failedCount };
  }

  async retryPhoto(id: string): Promise<void> {
    const photo = await localDb.attachments.get(id);
    if (photo) {
      photo.status = 'PENDING';
      photo.errorMessage = undefined;
      await localDb.attachments.put(photo);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fsm:photo_queue_updated', { detail: { workOrderId: photo.workOrderId, attachment: photo } }));
      }

      if (this.isDeviceOnline()) {
        await this.processPhotoQueue();
      }
    }
  }

  async deletePhoto(id: string): Promise<void> {
    let photo = await localDb.attachments.get(id);
    if (!photo) {
      photo = await localDb.attachments.filter((a) => a.serverAttachmentId === id).first();
    }
    if (!photo && !id.startsWith('srv-')) {
      photo = await localDb.attachments.get(`srv-${id}`);
    }

    const serverId =
      photo?.serverAttachmentId ||
      (id.startsWith('srv-') ? id.replace('srv-', '') : (!id.startsWith('att-') ? id : undefined));
    const targetWorkOrderId = photo?.workOrderId;

    if (photo) {
      await localDb.attachments.delete(photo.id);
      if (photo.serverAttachmentId) {
        const matching = await localDb.attachments.filter((a) => a.serverAttachmentId === photo?.serverAttachmentId).toArray();
        for (const m of matching) {
          await localDb.attachments.delete(m.id);
        }
      }
    } else {
      await localDb.attachments.delete(id);
    }

    if (targetWorkOrderId) {
      const wo = await localDb.workOrders.get(targetWorkOrderId);
      if (wo && wo.attachments) {
        wo.attachments = wo.attachments.filter(
          (a: any) => a.id !== id && a.id !== serverId && a.id !== photo?.id
        );
        await localDb.workOrders.put(wo);
      }
    }

    if (serverId && targetWorkOrderId) {
      if (this.isDeviceOnline()) {
        api.delete(`/work-orders/${targetWorkOrderId}/attachments/${serverId}`).catch(() => {});
      } else {
        await syncEngine.enqueueMutation(targetWorkOrderId, 'DELETE_ATTACHMENT', {
          attachmentId: serverId,
        });
      }
    } else if (photo?.url && this.isDeviceOnline()) {
      deleteImageFromS3(photo.url).catch(() => {});
    }

    if (typeof window !== 'undefined' && targetWorkOrderId) {
      window.dispatchEvent(
        new CustomEvent('fsm:photo_queue_updated', {
          detail: { workOrderId: targetWorkOrderId, deletedId: id },
        }),
      );
    }
  }

  async syncServerAttachments(workOrderId: string, serverAttachments?: any[]): Promise<void> {
    if (!serverAttachments) return;

    const localList = await localDb.attachments
      .where('workOrderId')
      .equals(workOrderId)
      .toArray();

    // Only prune srv- prefixed attachments that were downloaded from server and are no longer in serverAttachments
    const serverIdSet = new Set(serverAttachments.map((s) => s.id).filter(Boolean));
    for (const local of localList) {
      if (
        local.status === 'SYNCED' &&
        local.serverAttachmentId &&
        local.id.startsWith('srv-') &&
        !serverIdSet.has(local.serverAttachmentId)
      ) {
        await localDb.attachments.delete(local.id);
      }
    }

    const existingServerIds = new Set(
      localList.map((a) => a.serverAttachmentId || a.id).filter(Boolean),
    );
    const existingUrls = new Set(localList.map((a) => a.url).filter(Boolean));

    for (const srv of serverAttachments) {
      if (existingServerIds.has(srv.id) || (srv.fileUrl && existingUrls.has(srv.fileUrl))) {
        continue;
      }

      const createdTime = srv.createdAt ? new Date(srv.createdAt).getTime() : Date.now();
      const timeStr = formatTimeStr(srv.createdAt);

      const record: WorkOrderAttachment = {
        id: `srv-${srv.id}`,
        serverAttachmentId: srv.id,
        workOrderId,
        name: srv.fileName || 'Site Photo',
        size: srv.fileSize || 0,
        mimeType: srv.mimeType || 'image/jpeg',
        url: srv.fileUrl,
        previewUrl: srv.fileUrl,
        technicianId: srv.technicianId || srv.technician?.id || null,
        technicianName: srv.technician?.name || null,
        status: 'SYNCED',
        retryCount: 0,
        timestamp: timeStr,
        createdAt: createdTime,
      };

      await localDb.attachments.put(record);
    }
  }

  async getPhotosForWorkOrder(workOrderId: string, serverAttachments?: any[]): Promise<WorkOrderAttachment[]> {
    if (serverAttachments && serverAttachments.length > 0) {
      await this.syncServerAttachments(workOrderId, serverAttachments);
    }

    const photos = await localDb.attachments
      .where('workOrderId')
      .equals(workOrderId)
      .toArray();

    photos.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return photos.map((photo) => {
      if (photo.status === 'SYNCED' && photo.url) {
        return {
          ...photo,
          previewUrl: photo.url,
        };
      }
      if (photo.blob) {
        try {
          return {
            ...photo,
            previewUrl: URL.createObjectURL(photo.blob),
          };
        } catch {
          return photo;
        }
      }
      return photo;
    });
  }


  async getPendingCount(): Promise<number> {
    return await localDb.attachments
      .filter((a) => a.status === 'PENDING' || a.status === 'UPLOADING' || a.status === 'FAILED')
      .count();
  }

  public getIsUploading(): boolean {
    return this.isUploading;
  }
}

export const photoSyncEngine = new PhotoSyncEngine();
