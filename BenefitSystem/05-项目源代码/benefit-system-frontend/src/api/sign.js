import request from '@/utils/request'

export const signApply = (id, data) => request.put(`/sign/${id}`, data)
export const getFeedbackList = (params) => request.get('/sign/feedback', { params })
