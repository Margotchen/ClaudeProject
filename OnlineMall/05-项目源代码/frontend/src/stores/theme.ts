import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')

  function applyTheme(value: string) {
    theme.value = value
    document.documentElement.setAttribute('data-theme', value)
    document.documentElement.classList.toggle('dark', value === 'dark')
    localStorage.setItem('theme', value)
  }

  // 应用启动时恢复本地缓存主题（index.html 已内联处理首屏，这里兜底）
  function initTheme() {
    applyTheme(theme.value)
  }

  function toggleTheme() {
    applyTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  return { theme, applyTheme, initTheme, toggleTheme }
})
