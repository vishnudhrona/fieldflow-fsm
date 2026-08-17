import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

export const getAwsConfig = () => {
  return {
    region: process.env.AWS_REGION || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.AWS_S3_BUCKET_NAME || '',
  };
};

export const isS3Configured = (): boolean => {
  const { accessKeyId, secretAccessKey, bucketName } = getAwsConfig();
  return Boolean(accessKeyId && secretAccessKey && bucketName);
};

export const getS3Client = (): S3Client => {
  const { region, accessKeyId, secretAccessKey } = getAwsConfig();
  return new S3Client({
    region,
    credentials: isS3Configured()
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
  });
};

export const deleteFileFromS3 = async (keyOrUrl?: string | null): Promise<boolean> => {
  if (!keyOrUrl) return false;
  if (!isS3Configured()) return true;

  try {
    let s3Key = keyOrUrl;
    if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      const urlObj = new URL(keyOrUrl);
      s3Key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;
    }

    const { bucketName } = getAwsConfig();
    const s3 = getS3Client();

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
      })
    );

    return true;
  } catch (err) {
    return false;
  }
};
