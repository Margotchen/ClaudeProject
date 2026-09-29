import request from '@/utils/request'

export const exportApply = (params) => request.get('/export/apply', {
  params,
  responseType: 'blob'
})

export const exportStatistics = () => request.get('/export/statistics', {
  responseType: 'blob'
})
