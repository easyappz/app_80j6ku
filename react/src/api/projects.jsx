import instance from './axios';

/**
 * Projects API
 */

export async function listProjects() {
  const { data } = await instance.get('/api/projects/');
  return data;
}

export async function createProject({ title }) {
  const { data } = await instance.post('/api/projects/', { title });
  return data;
}

export async function getProject(id) {
  if (!id && id !== 0) throw new Error('Project id is required');
  const { data } = await instance.get(`/api/projects/${id}/`);
  return data;
}

export async function updateProject(id, { title }) {
  if (!id && id !== 0) throw new Error('Project id is required');
  const { data } = await instance.patch(`/api/projects/${id}/`, { title });
  return data;
}

export async function deleteProject(id) {
  if (!id && id !== 0) throw new Error('Project id is required');
  const { data } = await instance.delete(`/api/projects/${id}/`);
  return data;
}
