import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  checkWorkOrderExists,
  findExistingIdempotentAttachment,
  processFileUpload,
  createAttachmentRecord,
  getWorkOrderAttachments,
  deleteAttachmentRecord,
} from '../helpers/attachmentQueries';
import { recordWorkOrderHistory } from '../helpers/historyQueries';

export const addAttachment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: workOrderId } = req.params as { id: string };
    const technicianId = req.user?.id || null;
    const clientLocalId = (req.body.client_local_id || req.body.clientLocalId || req.headers['x-idempotency-key']) as
      | string
      | undefined;

    const exists = await checkWorkOrderExists(workOrderId);
    if (!exists) {
      res.status(404).json({ message: 'Work order not found' });
      return;
    }

    if (clientLocalId) {
      const existing = await findExistingIdempotentAttachment(workOrderId, clientLocalId);
      if (existing) {
        res.status(200).json({
          success: true,
          message: 'Attachment already synchronized (idempotent)',
          attachment: existing,
        });
        return;
      }
    }

    let fileUrl = req.body.file_url || req.body.url;
    if (!fileUrl && req.body.file && typeof req.body.file === 'string' && req.body.file.startsWith('data:')) {
      fileUrl = req.body.file;
    }
    let fileName = req.body.file_name || 'capture.jpg';
    let fileSize = req.body.file_size ? parseInt(req.body.file_size, 10) : null;
    let mimeType = req.body.mime_type || 'image/jpeg';

    if (req.file) {
      const uploadResult = await processFileUpload(req.file, workOrderId);
      fileUrl = uploadResult.fileUrl;
      fileName = uploadResult.fileName;
      fileSize = uploadResult.fileSize;
      mimeType = uploadResult.mimeType;
    }

    if (!fileUrl) {
      res.status(400).json({ message: 'No file received or file_url provided' });
      return;
    }

    const savedAttachment = await createAttachmentRecord({
      workOrderId,
      technicianId,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      clientLocalId: clientLocalId || null,
    });

    await recordWorkOrderHistory({
      workOrderId,
      userId: technicianId,
      action: 'PHOTO_UPLOADED',
      description: `Photo attachment '${fileName}' uploaded by ${req.user?.name || 'Technician'}.`,
      metadata: { fileName, fileSize, mimeType, attachmentId: savedAttachment?.id },
    });

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      attachment: savedAttachment,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to upload work order attachment',
      error: error?.message,
    });
  }
};

export const getAttachments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: workOrderId } = req.params as { id: string };

    const attachments = await getWorkOrderAttachments(workOrderId);

    res.status(200).json({
      success: true,
      count: attachments.length,
      attachments,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to fetch work order attachments',
      error: error?.message,
    });
  }
};

export const deleteAttachment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: workOrderId, attachmentId } = req.params as { id: string; attachmentId: string };

    const deleted = await deleteAttachmentRecord(attachmentId, workOrderId);

    if (!deleted) {
      res.status(404).json({ message: 'Attachment not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Failed to delete work order attachment',
      error: error?.message,
    });
  }
};
