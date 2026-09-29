import request from '@/utils/request'

export const getSeatMap = (orderId) => request.get(`/checkin/seats/${orderId}`)
export const selectSeat = (data) => request.post('/checkin/select-seat', data)
export const checkIn = (orderId) => request.post(`/checkin/checkin/${orderId}`)
