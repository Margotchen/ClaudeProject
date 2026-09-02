import request from '@/utils/request'

export const simulatePayment = (data) => request.post('/payments/simulate', data)
export const getPaymentStatus = (orderId) => request.get(`/payments/${orderId}/status`)
