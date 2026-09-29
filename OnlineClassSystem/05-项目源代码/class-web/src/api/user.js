import request from '../utils/request'

export function pageUsers(params) {
  return request.get('/user/page', { params })
}

export function createUser(data) {
  return request.post('/user', data)
}

export function updateUser(id, data) {
  return request.put(`/user/${id}`, data)
}

export function deleteUser(id) {
  return request.delete(`/user/${id}`)
}

export function updateUserStatus(id, status) {
  return request.put(`/user/${id}/status`, null, { params: { status } })
}

export function resetUserPassword(id, password) {
  return request.put(`/user/${id}/password`, { password })
}

export function updateTheme(theme) {
  return request.put('/user/theme', { theme })
}

export function listTeachers() {
  return request.get('/user/teachers')
}
