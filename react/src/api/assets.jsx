import instance from './axios';

/**
 * Assets API
 */

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const DEFAULT_CHUNK_SIZE = 512 * 1024; // 512KB fallback

function getFileExtension(name) {
  const parts = String(name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

export async function listAssets(projectId) {
  if (!projectId && projectId !== 0) throw new Error('Project id is required');
  const { data } = await instance.get(`/api/projects/${projectId}/assets/`);
  return data;
}

export async function uploadAsset(projectId, file, onProgress) {
  if (!projectId && projectId !== 0) throw new Error('Project id is required');
  if (!file) throw new Error('File is required');

  const ext = getFileExtension(file.name);
  if (ext !== 'mp4') {
    throw new Error('Only .mp4 files are allowed');
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('File size must be 50MB or less');
  }

  if (typeof onProgress === 'function') {
    try { onProgress(0); } catch (_) {}
  }

  // 1) Initialize chunked upload session
  const initRes = await instance.post(`/api/projects/${projectId}/assets/chunked/init/`, {
    filename: file.name,
    size: file.size,
    mime: file.type || 'video/mp4',
  });
  const uploadId = initRes.data?.upload_id;
  const chunkSize = initRes.data?.chunk_size || DEFAULT_CHUNK_SIZE;
  if (!uploadId) throw new Error('Failed to start upload');

  // 2) Upload chunks sequentially
  let offset = 0;
  let index = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
    const fd = new FormData();
    fd.append('chunk', slice, `${file.name}.part${index}`);
    fd.append('index', String(index));

    await instance.post(
      `/api/projects/${projectId}/assets/chunked/${uploadId}/`,
      fd,
      {
        headers: {
          // Override default JSON header so the browser sets proper multipart boundary
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    offset += slice.size;
    index += 1;
    if (typeof onProgress === 'function') {
      try { onProgress(Math.min(1, offset / file.size)); } catch (_) {}
    }
  }

  // 3) Complete the upload and get created Asset
  const { data } = await instance.post(`/api/projects/${projectId}/assets/chunked/${uploadId}/complete/`);
  if (typeof onProgress === 'function') { try { onProgress(1); } catch (_) {} }
  return data;
}
