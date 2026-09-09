import request from '@/utils/request'

export const getMyApplyList = (params) => request.get('/apply/my-list', { params })
export const getApplyList = (params) => request.get('/apply/list', { params })
export const getApplyDetail = (id) => request.get(`/apply/${id}`)
export const submitApply = (data) => request.post('/apply', data)
export const updateApply = (id, data) => request.put(`/apply/${id}`, data)
export const cancelApply = (id) => request.put(`/apply/${id}/cancel`)
