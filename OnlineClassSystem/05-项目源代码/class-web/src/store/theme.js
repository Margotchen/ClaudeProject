import { defineStore } from 'pinia'
import { ref } from 'vue'
import { updateTheme as updateThemeApi } from '../api/user'
import { getToken } from '../utils/auth'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')

  function applyTheme(value) {
    theme.value = value
    document.documentElement.setAttribute('data-theme', value)
    document.documentElement.classList.toggle('dark', value === 'dark')
    localStorage.setItem('theme', value)
  }

  // 应用启动时恢复本地缓存主题（index.html 已内联处理首屏，这里兜底）
  function initTheme() {
    applyTheme(theme.value)
  }

  // 切换主题并同步到后端（已登录时）；syncRemote=false 时仅本地应用（如登录后恢复后端偏好）
  async function setTheme(value, { syncRemote = true } = {}) {
    applyTheme(value)
    if (syncRemote && getToken()) {
      try {
        await updateThemeApi(value)
      } catch (e) {
        // 同步失败不回滚本地，仅提示由 request 拦截器统一处理
      }
    }
  }

  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  return { theme, initTheme, setTheme, toggleTheme }
})
