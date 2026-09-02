import request from '@/utils/request'

export const getDashboard = () => request.get('/statistics/dashboard')
