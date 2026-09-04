import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, logout as logoutApi, getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!userInfo.value)
  const roleCode = computed(() => userInfo.value?.roleCode)
  const isPassenger = computed(() => roleCode.value === 'passenger')
  const isService = computed(() => roleCode.value === 'service')
  const isOperator = computed(() => roleCode.value === 'operator')

  const setUserInfo = (value) => {
    userInfo.value = value
  }

  const clearSession = () => {
    userInfo.value = null
  }

  const validateUser = (res) => {
    const user = res?.data?.user
    if (!user || !user.roleCode) {
      throw new Error('Login failed')
    }
    return user
  }

  const login = async (credentials) => {
    const res = await loginApi(credentials)
    const user = validateUser(res)
    userInfo.value = user
    return user
  }

  const fetchUserInfo = async () => {
    const res = await getProfile()
    const user = validateUser(res)
    userInfo.value = user
    return user
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      userInfo.value = null
    }
  }

  return {
    userInfo,
    isLoggedIn,
    roleCode,
    isPassenger,
    isService,
    isOperator,
    login,
    fetchUserInfo,
    logout,
    clearSession,
    setUserInfo
  }
})
