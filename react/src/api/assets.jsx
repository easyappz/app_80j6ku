import instance from './axios';

/**
 * Assets API
 */

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

function getFileExtension(name) {
  const parts = String(name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

export async function listAssets(projectId) {
  if (!projectId && projectId !== 0) throw new Error('Project id is required');
  const { data } = await instance.get(`/api/projects/${projectId}/assets/`);
  return data;
}

export async function uploadAsset(projectId, file) {
  if (!projectId && projectId !== 0) throw new Error('Project id is required');
  if (!file) throw new Error('File is required');

  const ext = getFileExtension(file.name);
  if (ext !== 'mp4') {
    throw new Error('Only .mp4 files are allowed');
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File size must be 50MB or less');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Let the browser set the Content-Type with proper boundary for FormData
  const { data } = await instance.post(
    `/api/projects/${projectId}/assets/`,
    formData
  );

  return data;
}
