import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const roleCode = computed(() => userInfo.value?.role?.role_code)
  const isAdmin = computed(() => roleCode.value === 'admin')
  const isHr = computed(() => roleCode.value === 'hr' || roleCode.value === 'admin')
  const isEmployee = computed(() => roleCode.value === 'employee')

  const setToken = (value) => {
    token.value = value
    localStorage.setItem('token', value)
  }

  const setUserInfo = (value) => {
    userInfo.value = value
  }

  const fetchUserInfo = async () => {
    const res = await request.get('/auth/userinfo')
    userInfo.value = res.data
    return res.data
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    roleCode,
    isAdmin,
    isHr,
    isEmployee,
    setToken,
    setUserInfo,
    fetchUserInfo,
    logout
  }
})
