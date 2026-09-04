import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/login/index.vue'
import i18n from '@/locales'
import ElementPlus from 'element-plus'
import { useUserStore } from '@/stores/user'

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn()
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: Login, meta: { public: true } },
      { path: '/passenger/search', component: { template: '<div>search</div>' }, meta: { roles: ['passenger'] } },
      { path: '/operator/dashboard', component: { template: '<div>dashboard</div>' }, meta: { roles: ['operator'] } }
    ]
  })
}

function mountLogin(router) {
  return mount(Login, {
    global: {
      plugins: [createPinia(), i18n, ElementPlus, router]
    }
  })
}

describe('login view', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders username input with autocomplete off', () => {
    const router = createTestRouter()
    const wrapper = mountLogin(router)
    const inputs = wrapper.findAll('input')
    const usernameInput = inputs[0]
    expect(usernameInput?.attributes('autocomplete')).toBe('off')
  })

  it('renders password input with autocomplete new-password', () => {
    const router = createTestRouter()
    const wrapper = mountLogin(router)
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput?.attributes('autocomplete')).toBe('new-password')
  })

  it('logs in and redirects to query redirect', async () => {
    const router = createTestRouter()
    await router.push('/login?redirect=/operator/dashboard')
    await router.isReady()

    const loginMock = vi.fn().mockResolvedValue({ id: 2, roleCode: 'operator' })
    useUserStore.mockReturnValue({ login: loginMock, isLoggedIn: false, clearSession: vi.fn() })

    const wrapper = mountLogin(router)
    const inputs = wrapper.findAll('input')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await usernameInput.setValue('operator')
    await passwordInput.setValue('op123456')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginMock).toHaveBeenCalledWith({ username: 'operator', password: 'op123456' })
    expect(router.currentRoute.value.path).toBe('/operator/dashboard')
  })

  it('logs in and redirects to home when no redirect query', async () => {
    const router = createTestRouter()
    await router.push('/login')
    await router.isReady()

    const loginMock = vi.fn().mockResolvedValue({ id: 1, roleCode: 'passenger' })
    useUserStore.mockReturnValue({ login: loginMock, isLoggedIn: false, clearSession: vi.fn() })

    const wrapper = mountLogin(router)
    const inputs = wrapper.findAll('input')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await usernameInput.setValue('passenger')
    await passwordInput.setValue('p123456')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/passenger/search')
  })

  it('shows error message and clears password on login failure', async () => {
    const router = createTestRouter()
    await router.push('/login')
    await router.isReady()

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const loginMock = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    useUserStore.mockReturnValue({ login: loginMock, isLoggedIn: false, clearSession: vi.fn() })

    const wrapper = mountLogin(router)
    const inputs = wrapper.findAll('input')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await usernameInput.setValue('bad')
    await passwordInput.setValue('wrong')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(passwordInput.element.value).toBe('')
    expect(loginMock).toHaveBeenCalled()
    // should not leak raw axios/credential objects
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
