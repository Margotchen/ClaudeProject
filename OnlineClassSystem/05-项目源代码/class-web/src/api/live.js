import request from '../utils/request'
import { getToken } from '../utils/auth'

export function pageSchedules(params) {
  return request.get('/live/schedule/page', { params })
}

export function createSchedule(data) {
  return request.post('/live/schedule', data)
}

export function updateSchedule(id, data) {
  return request.put(`/live/schedule/${id}`, data)
}

export function deleteSchedule(id) {
  return request.delete(`/live/schedule/${id}`)
}

// ---------- 直播会话 ----------

export function getRoomInfo(scheduleId) {
  return request.get(`/live/session/room/${scheduleId}`)
}

export function startLive(scheduleId) {
  return request.post(`/live/session/start/${scheduleId}`)
}

export function endLive(scheduleId) {
  return request.post(`/live/session/end/${scheduleId}`)
}

export function getPushUrl(scheduleId) {
  return request.get(`/live/session/push-url/${scheduleId}`)
}

// ---------- 互动消息 ----------

export function pageInteractions(params) {
  return request.get('/live/interaction/page', { params })
}

export function getVoteResult(voteId) {
  return request.get(`/live/interaction/vote/${voteId}`)
}

// ---------- 课程录播 ----------

export function pagePlayback(params) {
  return request.get('/live/playback/page', { params })
}

export function updatePlaybackStatus(id, status) {
  return request.put(`/live/playback/${id}/status`, null, { params: { status } })
}

export function deletePlayback(id) {
  return request.delete(`/live/playback/${id}`)
}

/** 录播文件流地址（video 标签无法带请求头，token 走 query） */
export function playbackFileUrl(id) {
  return `/api/live/playback/file/${id}?token=${encodeURIComponent(getToken() || '')}`
}
