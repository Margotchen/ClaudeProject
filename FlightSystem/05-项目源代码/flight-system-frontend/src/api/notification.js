import request from '@/utils/request'

export const getNotifications = (params) => request.get('/notifications', { params })
export const getUnreadCount = () => request.get('/notifications/unread-count')
export const markAsRead = (id) => request.put(`/notifications/${id}/read`)
