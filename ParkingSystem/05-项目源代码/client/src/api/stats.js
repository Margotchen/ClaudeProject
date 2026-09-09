import api from './index';

export function getOverview() {
  return api.get('/stats/overview');
}

export function getAreaUtilization(params) {
  return api.get('/stats/area-utilization', { params });
}

export function getTimeTrend(params) {
  return api.get('/stats/time-trend', { params });
}

export function getDetailedStats(params) {
  return api.get('/stats/details', { params });
}

export function exportStatsCSV(params) {
  return api.get('/stats/export', {
    params,
    responseType: 'blob'
  });
}
