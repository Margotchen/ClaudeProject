import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout/index.vue'
import i18n from '@/locales'
import ElementPlus from 'element-plus'
import { useUserStore } from '@/stores/user'

vi.mock('@/api/notification', () => ({
  getUnreadCount: vi.fn().mockResolvedValue({ code: 200, data: { count: 0 } }),
  getNotifications: vi.fn().mockResolvedValue({ code: 200, data: { list: [] } }),
  markAsRead: vi.fn().mockResolvedValue({ code: 200 })
}))

vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn()
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/login', component: { template: '<div>login</div>' }, meta: { public: true } },
      { path: '/passenger/search', component: { template: '<div>search</div>' }, meta: { roles: ['passenger'] } }
    ]
  })
}

function mountLayout(router) {
  return mount(Layout, {
    global: {
      plugins: [createPinia(), i18n, ElementPlus, router]
    },
    attachTo: document.body
  })
}

function findLogoutButton(wrapper) {
  return wrapper.findAll('button').find(b => b.text().includes('退出登录'))
}

describe('Layout logout', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows success and redirects on successful logout', async () => {
    const router = createTestRouter()
    await router.push('/passenger/search')
    await router.isReady()

    const logoutMock = vi.fn().mockResolvedValue(undefined)
    useUserStore.mockReturnValue({
      userInfo: { id: 1, roleCode: 'passenger', realName: 'P1' },
      isLoggedIn: true,
      isPassenger: true,
      isService: false,
      isOperator: false,
      logout: logoutMock
    })

    const successSpy = vi.spyOn(ElMessage, 'success').mockImplementation(() => {})
    const errorSpy = vi.spyOn(ElMessage, 'error').mockImplementation(() => {})

    const wrapper = mountLayout(router)
    await flushPromises()

    const logoutButton = findLogoutButton(wrapper)
    expect(logoutButton).toBeTruthy()
    await logoutButton.trigger('click')
    await flushPromises()

    expect(logoutMock).toHaveBeenCalled()
    expect(successSpy).toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/login')

    successSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('shows error and stays on current page when logout fails', async () => {
    const router = createTestRouter()
    await router.push('/passenger/search')
    await router.isReady()

    const logoutMock = vi.fn().mockRejectedValue(new Error('Server error'))
    useUserStore.mockReturnValue({
      userInfo: { id: 1, roleCode: 'passenger', realName: 'P1' },
      isLoggedIn: true,
      isPassenger: true,
      isService: false,
      isOperator: false,
      logout: logoutMock
    })

    const successSpy = vi.spyOn(ElMessage, 'success').mockImplementation(() => {})
    const errorSpy = vi.spyOn(ElMessage, 'error').mockImplementation(() => {})

    const wrapper = mountLayout(router)
    await flushPromises()

    const logoutButton = findLogoutButton(wrapper)
    await logoutButton.trigger('click')
    await flushPromises()

    expect(logoutMock).toHaveBeenCalled()
    expect(successSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/passenger/search')

    successSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
