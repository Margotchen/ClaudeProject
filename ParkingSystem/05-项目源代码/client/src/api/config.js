import api from './index';

export function getConfigs() {
  return api.get('/configs');
}

export function updateConfig(key, configValue) {
  return api.put(`/configs/${key}`, { configValue });
}
