import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getUserInfo as getUserInfoApi } from '../api/auth'
import { setToken, getToken, clearToken } from '../utils/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken() || '')
  const userInfo = ref(null)

  const roleCode = computed(() => userInfo.value?.roleCode || '')

  async function login(loginForm) {
    const data = await loginApi(loginForm)
    token.value = data.token
    setToken(data.token)
  }

  async function fetchUserInfo() {
    const data = await getUserInfoApi()
    userInfo.value = data
    return data
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    clearToken()
  }

  return { token, userInfo, roleCode, login, fetchUserInfo, logout }
})
