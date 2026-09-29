import request from '@/utils/request'

export const applyRefund = (data) => request.post('/refund-change/refund', data)
export const applyChange = (data) => request.post('/refund-change/change', data)
export const getMyApplications = (params) => request.get('/refund-change/my', { params })
export const getPendingApplications = (params) => request.get('/refund-change/pending', { params })
export const processApplication = (id, data) => request.put(`/refund-change/${id}/process`, data)
