import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { login as loginApi, logout as logoutApi, getProfile } from '@/api/auth'

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getProfile: vi.fn()
}))

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('login stores user when response contains data.user', async () => {
    const userStore = useUserStore()
    loginApi.mockResolvedValue({
      code: 200,
      data: { user: { id: 1, username: 'p1', roleCode: 'passenger' } }
    })

    await userStore.login({ username: 'p1', password: '123456' })

    expect(userStore.isLoggedIn).toBe(true)
    expect(userStore.roleCode).toBe('passenger')
  })

  it('login throws when response is missing data.user', async () => {
    const userStore = useUserStore()
    loginApi.mockResolvedValue({ code: 200, data: {} })

    await expect(userStore.login({ username: 'p1', password: '123456' }))
      .rejects.toThrow('Login failed')

    expect(userStore.isLoggedIn).toBe(false)
  })

  it('fetchUserInfo stores user', async () => {
    const userStore = useUserStore()
    getProfile.mockResolvedValue({
      code: 200,
      data: { user: { id: 1, username: 'p1', roleCode: 'passenger' } }
    })

    await userStore.fetchUserInfo()

    expect(userStore.isLoggedIn).toBe(true)
  })

  it('logout calls logoutApi and clears userInfo', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 1, roleCode: 'passenger' }
    logoutApi.mockResolvedValue({ code: 200 })

    await userStore.logout()

    expect(logoutApi).toHaveBeenCalled()
    expect(userStore.isLoggedIn).toBe(false)
  })

  it('logout still clears userInfo when logoutApi fails', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 1, roleCode: 'passenger' }
    logoutApi.mockRejectedValue(new Error('network error'))

    await expect(userStore.logout()).rejects.toThrow('network error')
    expect(userStore.isLoggedIn).toBe(false)
  })

  it('clearSession clears userInfo without calling logoutApi', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 1, roleCode: 'passenger' }

    userStore.clearSession()

    expect(userStore.isLoggedIn).toBe(false)
    expect(logoutApi).not.toHaveBeenCalled()
  })
})
