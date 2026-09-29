import request from '../utils/request'
import { getToken } from '../utils/auth'

// ========== 作业 ==========
export const pageHomework = (params) => request.get('/homework/page', { params })
export const createHomework = (data) => request.post('/homework', data)
export const updateHomework = (id, data) => request.put(`/homework/${id}`, data)
export const deleteHomework = (id) => request.delete(`/homework/${id}`)
export const submitHomework = (data) => request.post('/homework/submit', data)
export const pageSubmissions = (id, params) => request.get(`/homework/${id}/submissions`, { params })
export const mySubmission = (id) => request.get(`/homework/${id}/my`)
export const gradeHomework = (data) => request.post('/homework/grade', data)

// ========== 考试 ==========
export const pageExam = (params) => request.get('/exam/page', { params })
export const getExamDetail = (id) => request.get(`/exam/${id}`)
export const createExam = (data) => request.post('/exam', data)
export const updateExam = (id, data) => request.put(`/exam/${id}`, data)
export const deleteExam = (id) => request.delete(`/exam/${id}`)
export const startExam = (id) => request.post(`/exam/${id}/start`)
export const submitExam = (data) => request.post('/exam/submit', data)
export const pageExamRecords = (id, params) => request.get(`/exam/${id}/records`, { params })
export const getRecordDetail = (recordId) => request.get(`/exam/record/${recordId}`)
export const myExamRecords = (examId) => request.get('/exam/my-records', { params: { examId } })
export const gradeExam = (data) => request.post('/exam/grade', data)

// ========== 文件 ==========
export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return request.post('/file/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const fileDownloadUrl = (path, name) =>
  `/api/file/download?path=${encodeURIComponent(path)}${name ? `&name=${encodeURIComponent(name)}` : ''}&token=${getToken()}`
