import request from '../utils/request'
import { getToken } from '../utils/auth'

// ========== 学习进度 ==========
export const heartbeat = (data) => request.post('/study/heartbeat', data)
export const myProgress = () => request.get('/study/my-progress')

// ========== 统计分析 ==========
export const statsOverview = () => request.get('/stats/overview')
export const courseStats = () => request.get('/stats/course')
export const scoreDistribution = (courseId) => request.get(`/stats/course/${courseId}/score-distribution`)
export const studentStats = () => request.get('/stats/student')

// 导出下载（a 标签/window.open 无法带 header，token 走 query）
export const statsExportUrl = (dimension, format) =>
  `/api/stats/export?dimension=${dimension}&format=${format}&token=${getToken()}`
