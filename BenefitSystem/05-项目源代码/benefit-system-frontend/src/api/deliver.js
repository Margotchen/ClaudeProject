import request from '@/utils/request'

export const deliverApply = (id, data) => request.put(`/deliver/${id}`, data)
export const batchDeliver = (data) => request.put('/deliver/batch', data)
