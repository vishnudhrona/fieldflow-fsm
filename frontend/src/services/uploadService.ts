import api from './api';

export interface UploadOptions {
  folder?: string;
  onProgress?: (progressPercent: number) => void;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  key: string;
  fileName: string;
  size: number;
}

export async function uploadImageToS3(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const { folder = 'assets', onProgress } = options;

  const formData = new FormData();
  formData.append('file', file);
  if (folder) formData.append('folder', folder);

  const response = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  return response.data.url;
}

export async function deleteImageFromS3(urlOrKey: string): Promise<void> {
  if (!urlOrKey) return;
  await api.delete('/upload', {
    data: { url: urlOrKey },
  });
}

export default uploadImageToS3;
