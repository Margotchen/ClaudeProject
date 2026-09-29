import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import i18n from './locales'
import { useThemeStore } from '@/stores/theme'

import request from '@/utils/request'

import '@/styles/reset.css'
import '@/styles/theme.css'
import '@/styles/common.css'
import '@/styles/transition.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

const pinia = createPinia()
app.use(pinia)
app.use(i18n)
app.use(router)
request.setRouter(router)
app.use(ElementPlus)

// 初始化主题（index.html 内联脚本已防首屏闪烁，这里兜底同步状态）
useThemeStore().initTheme()

app.mount('#app')
