import request from '@/utils/request'

export const searchFlights = (params) => request.get('/flights/search', { params })

export const getFlightList = (params) => request.get('/flights', { params })
export const createFlight = (data) => request.post('/flights', data)
export const updateFlight = (id, data) => request.put(`/flights/${id}`, data)
export const deleteFlight = (id) => request.delete(`/flights/${id}`)
export const getFlightDetail = (id) => request.get(`/flights/${id}`)

export const getScheduleList = (params) => request.get('/flights/schedules/list', { params })
export const createSchedule = (data) => request.post('/flights/schedules', data)
export const getScheduleDetail = (id) => request.get(`/flights/schedules/${id}`)
export const updateSchedule = (id, data) => request.put(`/flights/schedules/${id}`, data)
export const deleteSchedule = (id) => request.delete(`/flights/schedules/${id}`)
export const updateScheduleStatus = (id, data) => request.put(`/flights/schedules/${id}/status`, data)
