import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const DEFAULT_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true
}

export function createRequest({ axios: axiosLib = axios, message = ElMessage, config = DEFAULT_CONFIG } = {}) {
  const request = axiosLib.create(config)
  let router = null
  let isClearingSession = false

  function setRouter(r) {
    router = r
  }

  async function clearAuthAndRedirect() {
    if (isClearingSession) return
    isClearingSession = true

    try {
      const userStore = useUserStore()
      await userStore.clearSession()
    } catch {
      // ignore cleanup errors
    }

    const target = { path: '/login' }
    if (router?.currentRoute?.value?.fullPath) {
      target.query = { redirect: router.currentRoute.value.fullPath }
    }

    try {
      if (router) {
        await router.replace(target)
      } else {
        const query = target.query
          ? `?redirect=${encodeURIComponent(target.query.redirect)}`
          : ''
        window.location.href = `/login${query}`
      }
    } finally {
      isClearingSession = false
    }
  }

  request.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
  )

  request.interceptors.response.use(
    (response) => {
      if (response.config.responseType === 'blob') {
        return response
      }
      const res = response.data
      if (res.code !== 200) {
        message.error(res.message || 'Request failed')
        if (res.code === 401) {
          clearAuthAndRedirect()
        }
        return Promise.reject(new Error(res.message || 'Request failed'))
      }
      return res
    },
    async (error) => {
      let msg = error.message || 'Network error'
      if (error.config?.responseType === 'blob' && error.response?.data) {
        try {
          const text = await error.response.data.text()
          const json = JSON.parse(text)
          msg = json.message || msg
        } catch {
          // ignore parse failure
        }
      } else {
        msg = error.response?.data?.message || msg
      }
      message.error(msg)
      if (error.response?.status === 401) {
        await clearAuthAndRedirect()
      }
      return Promise.reject(error)
    }
  )

  request.setRouter = setRouter

  return request
}

const request = createRequest()

export function setRouter(router) {
  request.setRouter(router)
}

export default request
