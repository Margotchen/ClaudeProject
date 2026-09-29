import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import App from './App.vue'
import router from './router'
import { useThemeStore } from './store/theme'

import './styles/reset.scss'
import './styles/theme.scss'
import './styles/common.scss'
import './styles/transition.scss'

const app = createApp(App)
const pinia = createPinia()

// 全局注册 Element Plus 图标（侧边栏菜单按名称动态渲染）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })

// 应用启动时恢复主题
useThemeStore().initTheme()

app.mount('#app')
