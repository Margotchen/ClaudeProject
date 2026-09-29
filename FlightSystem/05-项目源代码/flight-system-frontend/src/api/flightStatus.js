import request from '@/utils/request'

export const listFlightStatuses = (params) => request.get('/flight-status', { params })
export const getFlightStatus = (scheduleId) => request.get(`/flight-status/${scheduleId}`)
