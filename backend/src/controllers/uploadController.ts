import { Request, Response } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  isS3Configured,
  getAwsConfig,
  getS3Client,
  deleteFileFromS3,
} from '../config/s3';

export const uploadToS3ViaMulter = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file received' });
      return;
    }

    if (!req.file.mimetype.startsWith('image/')) {
      res.status(400).json({ message: 'Only image files are allowed' });
      return;
    }

    const { folder = 'assets' } = req.body;
    const { bucketName, region } = getAwsConfig();
    const s3 = getS3Client();

    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const key = `${folder}/${uniquePrefix}-${sanitizedFileName}`;

    if (isS3Configured()) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

      res.status(200).json({
        success: true,
        url: s3Url,
        key,
        fileName: req.file.originalname,
        size: req.file.size,
      });
      return;
    }

    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.status(200).json({
      success: true,
      url: base64Data,
      key,
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to upload image to AWS S3', error: error?.message });
  }
};

export const deleteFromS3 = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({ message: 'url is required' });
      return;
    }

    await deleteFileFromS3(url);

    res.status(200).json({ success: true, message: 'Image deleted from S3 successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete image from S3', error: error?.message });
  }
};
