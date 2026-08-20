import { PutObjectCommand } from '@aws-sdk/client-s3';
import { WorkOrderAttachment, User, WorkOrder } from '../models';
import { isS3Configured, getAwsConfig, getS3Client, deleteFileFromS3 } from '../config/s3';

export interface CreateAttachmentInput {
  workOrderId: string;
  technicianId?: string | null;
  fileUrl: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string;
  clientLocalId?: string | null;
}

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

export const processFileUpload = async (
  file: Express.Multer.File,
  workOrderId: string,
): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }> => {
  let fileUrl = '';
  const fileName = file.originalname;
  const fileSize = file.size;
  const mimeType = file.mimetype;

  if (isS3Configured()) {
    const { bucketName, region } = getAwsConfig();
    const s3 = getS3Client();

    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
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
};

export const getWorkOrderAttachments = async (workOrderId: string) => {
  return await WorkOrderAttachment.findAll({
    where: { workOrderId },
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
