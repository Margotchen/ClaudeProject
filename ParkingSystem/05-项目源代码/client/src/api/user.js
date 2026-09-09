import api from './index';

export function getUsers(params) {
  return api.get('/users', { params });
}

export function createUser(data) {
  return api.post('/users', data);
}

export function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

export function resetPassword(id, data) {
  return api.post(`/users/${id}/reset-password`, data);
}

export function unbanUser(id) {
  return api.post(`/users/${id}/unban`);
}

export function getDepartments() {
  return api.get('/users/departments');
}
