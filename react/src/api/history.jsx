import instance from './axios';

/**
 * History API
 */

export async function listHistory(projectId) {
  if (!projectId && projectId !== 0) throw new Error('Project id is required');
  const { data } = await instance.get(`/api/projects/${projectId}/history/`);
  return data;
}

export async function addHistory(projectId, { action, params }) {
  if (!projectId && projectId !== 0) throw new Error('Project id is required');
  const payload = { action, params };
  const { data } = await instance.post(`/api/projects/${projectId}/history/`, payload);
  return data;
}
