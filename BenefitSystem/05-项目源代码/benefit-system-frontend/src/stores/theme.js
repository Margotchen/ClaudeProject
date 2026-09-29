import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: localStorage.getItem('theme') || 'light'
  }),
  actions: {
    applyTheme(value) {
      this.theme = value
      document.documentElement.setAttribute('data-theme', value)
      document.documentElement.classList.toggle('dark', value === 'dark')
      localStorage.setItem('theme', value)
    },
    initTheme() {
      this.applyTheme(this.theme)
    },
    toggleTheme() {
      this.applyTheme(this.theme === 'light' ? 'dark' : 'light')
    }
  }
})
