import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'
import { getProfile } from '@/api/auth'
import router from '@/router'

vi.mock('@/api/auth', () => ({
  getProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

describe('router guard', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    const userStore = useUserStore()
    userStore.userInfo = null
    getProfile.mockReset()
    await router.push('/')
    await router.isReady()
  })

  it('redirects unauthenticated users to /login with redirect query', async () => {
    getProfile.mockRejectedValue(new Error('Unauthorized'))

    await router.push('/passenger/order/123')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/passenger/order/123')
  })

  it('preserves target route and redirects there after session restore', async () => {
    getProfile.mockResolvedValue({
      code: 200,
      data: { user: { id: 1, username: 'p1', roleCode: 'passenger' } }
    })

    await router.push('/passenger/order/123')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/passenger/order/123')
  })

  it('redirects passenger to /passenger/search from /', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 1, roleCode: 'passenger' }

    await router.push('/')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/passenger/search')
  })

  it('redirects operator to /operator/dashboard from /', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 2, roleCode: 'operator' }

    await router.push('/')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/operator/dashboard')
  })

  it('redirects unknown role to /login instead of infinite loop', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 3, roleCode: 'admin' }

    await router.push('/')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('prevents logged-in users from visiting /login', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 2, roleCode: 'operator' }

    await router.push('/login')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/operator/dashboard')
  })

  it('blocks role mismatch and redirects to role home', async () => {
    const userStore = useUserStore()
    userStore.userInfo = { id: 2, roleCode: 'operator' }

    await router.push('/passenger/search')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/operator/dashboard')
  })
})

function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}
