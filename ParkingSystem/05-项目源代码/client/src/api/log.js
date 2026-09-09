import api from './index';

export function getLogs(params) {
  return api.get('/logs', { params });
}
