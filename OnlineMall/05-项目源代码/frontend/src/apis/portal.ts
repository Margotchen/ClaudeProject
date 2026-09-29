import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 读取本地持久化的买家 token（避免与 buyer store 循环依赖）
 */
function getBuyerToken(): string {
  try {
    const raw = localStorage.getItem('buyer')
    if (!raw) {
      return ''
    }
    const parsed = JSON.parse(raw)
    return parsed?.token || ''
  } catch (e) {
    return ''
  }
}

/**
 * portal 后端 HTTP 客户端（买家端）
 * baseURL 指向 mall-portal：http://localhost:8085
 */
const portal = axios.create({
  baseURL: 'http://localhost:8085',
  timeout: 10000,
})

portal.interceptors.request.use(
  config => {
    const token = getBuyerToken()
    if (token) {
      config.headers.Authorization = token
    }
    return config
  },
  error => Promise.reject(error),
)

portal.interceptors.response.use(
  response => {
    const res = response.data as { code: number; message: string; data: unknown }
    if (res.code !== 200) {
      ElMessage({
        message: res.message,
        type: 'error',
        duration: 3 * 1000,
      })
      if (res.code === 401) {
        ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
          confirmButtonText: '去登录',
          cancelButtonText: '取消',
          type: 'warning',
        }).then(() => {
          localStorage.removeItem('buyer')
          window.location.href = '/#/buyer/login'
        })
      }
      return Promise.reject('error')
    }
    return response.data
  },
  error => {
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 3 * 1000,
    })
    return Promise.reject(error)
  },
)

export default portal
