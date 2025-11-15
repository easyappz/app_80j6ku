import instance from './axios';

/**
 * Auth API
 * - register({ email, name, password }) -> POST '/api/auth/register/'
 * - login({ email, password }) -> POST '/api/auth/login/'
 * - profile() -> GET '/api/auth/profile/'
 */

export async function register({ email, name, password }) {
  const { data } = await instance.post('/api/auth/register/', { email, name, password });
  return data;
}

export async function login({ email, password }) {
  const { data } = await instance.post('/api/auth/login/', { email, password });
  return data;
}

export async function profile() {
  const { data } = await instance.get('/api/auth/profile/');
  return data;
}
