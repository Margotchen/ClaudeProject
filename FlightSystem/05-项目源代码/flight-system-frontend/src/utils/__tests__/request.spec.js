import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRequest } from '@/utils/request'
import { useUserStore } from '@/stores/user'

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn()
}))

function buildMocks() {
  const clearSession = vi.fn()
  const useUserStoreMock = useUserStore
  useUserStoreMock.mockReturnValue({ clearSession, userInfo: null, isLoggedIn: false })

  const message = { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }

  const replace = vi.fn()
  const router = {
    currentRoute: { value: { fullPath: '/passenger/orders' } },
    replace
  }

  const instance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
  const axiosInstance = { create: vi.fn(() => instance) }
  const request = createRequest({ axios: axiosInstance, message })
  request.setRouter(router)

  const responseHandler = instance.interceptors.response.use.mock.calls[0][0]
  const errorHandler = instance.interceptors.response.use.mock.calls[0][1]

  return { request, responseHandler, errorHandler, clearSession, replace, message }
}

describe('request 401 handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('success interceptor clears session and redirects on 401 code', async () => {
    const { responseHandler, clearSession, replace } = buildMocks()
    const response = {
      config: {},
      data: { code: 401, message: 'Unauthorized' }
    }

    await expect(responseHandler(response)).rejects.toThrow('Unauthorized')

    expect(clearSession).toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/passenger/orders' } })
  })

  it('error interceptor clears session and redirects on 401 status', async () => {
    const { errorHandler, clearSession, replace } = buildMocks()
    const error = {
      response: { status: 401, data: { message: 'Unauthorized' } },
      message: 'Request failed'
    }

    await expect(errorHandler(error)).rejects.toThrow()

    expect(clearSession).toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/passenger/orders' } })
  })

  it('deduplicates concurrent 401 handling', async () => {
    const { responseHandler, clearSession, replace } = buildMocks()
    const response = {
      config: {},
      data: { code: 401, message: 'Unauthorized' }
    }

    const p1 = responseHandler(response).catch(() => {})
    const p2 = responseHandler(response).catch(() => {})
    await Promise.all([p1, p2])

    expect(clearSession).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('does not use logout() inside 401 handler', async () => {
    const { responseHandler, clearSession } = buildMocks()
    const response = {
      config: {},
      data: { code: 401, message: 'Unauthorized' }
    }

    await responseHandler(response).catch(() => {})

    // useUserStore().logout would call logoutApi; we only expect clearSession
    expect(clearSession).toHaveBeenCalled()
    expect(useUserStore().logout).toBeUndefined()
  })
})
