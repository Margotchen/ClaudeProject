import request from '@/utils/request'

export const createBooking = (data) => request.post('/bookings', data)
export const getMyOrders = (params) => request.get('/bookings/my', { params })
export const getOrderDetail = (id) => request.get(`/bookings/${id}`)
export const cancelOrder = (id) => request.post(`/bookings/${id}/cancel`)
