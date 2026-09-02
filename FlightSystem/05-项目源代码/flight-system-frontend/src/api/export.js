import request from '@/utils/request'

export const exportOrders = (format = 'xlsx') => request.get(`/export/orders?format=${format}`, { responseType: 'blob' })
export const exportFlights = (format = 'xlsx') => request.get(`/export/flights?format=${format}`, { responseType: 'blob' })
