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

  const login = async (credentials) => {
    const res = await loginApi(credentials)
    userInfo.value = res.data.user
    return res.data.user
  }

  const fetchUserInfo = async () => {
    const res = await getProfile()
    userInfo.value = res.data.user
    return res.data.user
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
    setUserInfo
  }
})
