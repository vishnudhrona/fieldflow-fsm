import { PutObjectCommand } from '@aws-sdk/client-s3';
import { WorkOrderAttachment, User, WorkOrder } from '../models';
import { isS3Configured, getAwsConfig, getS3Client, deleteFileFromS3 } from '../config/s3';
import { ROLES } from '../config/constants';

export interface CreateAttachmentInput {
  workOrderId: string;
  technicianId?: string | null;
  fileUrl: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string;
  clientLocalId?: string | null;
}

export const checkWorkOrderAuthorization = async (
  user: { id: string; role: string } | undefined,
  workOrderId: string,
): Promise<{ ok: boolean; status: number; message: string; workOrder?: any }> => {
  if (!user?.id) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  const workOrder = await WorkOrder.findByPk(workOrderId);
  if (!workOrder) {
    return { ok: false, status: 404, message: 'Work order not found' };
  }

  if (user.role === ROLES.ADMIN_DISPATCHER || workOrder.technicianId === user.id) {
    return { ok: true, status: 200, message: 'Authorized', workOrder };
  }

  return { ok: false, status: 403, message: 'Forbidden: You do not have access to this work order' };
};

export const checkWorkOrderExists = async (workOrderId: string): Promise<boolean> => {
  const count = await WorkOrder.count({ where: { id: workOrderId } });
  return count > 0;
};

export const findExistingIdempotentAttachment = async (
  workOrderId: string,
  clientLocalId: string,
) => {
  return await WorkOrderAttachment.findOne({
    where: { workOrderId, clientLocalId },
    include: [{ model: User, as: 'technician', attributes: ['id', 'name', 'email'] }],
  });
};

export const isValidImageBuffer = (buffer: Buffer): boolean => {
  if (!buffer || buffer.length < 4) return false;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }
  return false;
};

export const processFileUpload = async (
  file: Express.Multer.File,
  workOrderId: string,
): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }> => {
  let fileUrl = '';
  const fileName = file.originalname || 'capture.jpg';
  const fileSize = file.size;
  const mimeType = file.mimetype;

  if (!isValidImageBuffer(file.buffer)) {
    throw new Error('Invalid image file: file content signature does not match supported image formats (JPEG, PNG, WebP)');
  }

  if (isS3Configured()) {
    const { bucketName, region } = getAwsConfig();
    const s3 = getS3Client();

    const sanitizedFileName = (file.originalname || 'capture.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const key = `work-orders/${workOrderId}/${uniquePrefix}-${sanitizedFileName}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  } else {
    fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  }

  return { fileUrl, fileName, fileSize, mimeType };
};

export const createAttachmentRecord = async (data: CreateAttachmentInput) => {
  try {
    const attachment = await WorkOrderAttachment.create({
      workOrderId: data.workOrderId,
      technicianId: data.technicianId || null,
      fileUrl: data.fileUrl,
      fileName: data.fileName || 'capture.jpg',
      fileSize: data.fileSize || null,
      mimeType: data.mimeType || 'image/jpeg',
      clientLocalId: data.clientLocalId || null,
    });

    return await WorkOrderAttachment.findByPk(attachment.id, {
      include: [{ model: User, as: 'technician', attributes: ['id', 'name', 'email'] }],
    });
  } catch (err: any) {
    if (err?.name === 'SequelizeUniqueConstraintError' && data.clientLocalId) {
      const existing = await findExistingIdempotentAttachment(data.workOrderId, data.clientLocalId);
      if (existing) return existing;
    }
    throw err;
  }
};

export const getWorkOrderAttachments = async (
  workOrderId: string,
  technicianId?: string | null,
) => {
  const whereClause: any = { workOrderId };
  if (technicianId) {
    whereClause.technicianId = technicianId;
  }

  return await WorkOrderAttachment.findAll({
    where: whereClause,
    include: [{ model: User, as: 'technician', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'DESC']],
  });
};

export const deleteAttachmentRecord = async (
  attachmentId: string,
  workOrderId: string,
): Promise<boolean> => {
  const attachment = await WorkOrderAttachment.findOne({
    where: { id: attachmentId, workOrderId },
  });

  if (!attachment) return false;

  if (attachment.fileUrl) {
    await deleteFileFromS3(attachment.fileUrl).catch(() => {});
  }

  await attachment.destroy();
  return true;
};
