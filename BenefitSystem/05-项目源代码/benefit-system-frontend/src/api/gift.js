import request from '@/utils/request'

export const getGiftList = (params) => request.get('/gifts', { params })
export const getGiftDetail = (id) => request.get(`/gifts/${id}`)
export const createGift = (data) => request.post('/gifts', data)
export const updateGift = (id, data) => request.put(`/gifts/${id}`, data)
export const deleteGift = (id) => request.delete(`/gifts/${id}`)
export const updateGiftStatus = (id, data) => request.put(`/gifts/${id}/status`, data)
export const adjustGiftStock = (id, data) => request.put(`/gifts/${id}/stock`, data)
