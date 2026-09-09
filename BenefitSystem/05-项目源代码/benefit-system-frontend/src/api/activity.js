import request from '@/utils/request'

export const getActivityList = (params) => request.get('/activities', { params })
export const getAvailableActivities = () => request.get('/activities/available')
export const getActivityDetail = (id) => request.get(`/activities/${id}`)
export const createActivity = (data) => request.post('/activities', data)
export const updateActivity = (id, data) => request.put(`/activities/${id}`, data)
export const deleteActivity = (id) => request.delete(`/activities/${id}`)
export const updateActivityStatus = (id, data) => request.put(`/activities/${id}/status`, data)
export const getActivityGifts = (id) => request.get(`/activities/${id}/gifts`)
export const setActivityGifts = (id, data) => request.put(`/activities/${id}/gifts`, data)
