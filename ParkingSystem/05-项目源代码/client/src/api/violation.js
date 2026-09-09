import api from './index';

export function getViolations(params) {
  return api.get('/violations', { params });
}

export function pardonViolation(id) {
  return api.post(`/violations/${id}/pardon`);
}
