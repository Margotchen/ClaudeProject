import request from '../utils/request'

export function pageCourses(params) {
  return request.get('/course/page', { params })
}

export function createCourse(data) {
  return request.post('/course', data)
}

export function updateCourse(id, data) {
  return request.put(`/course/${id}`, data)
}

export function deleteCourse(id) {
  return request.delete(`/course/${id}`)
}

export function updateCourseStatus(id, status) {
  return request.put(`/course/${id}/status`, null, { params: { status } })
}
