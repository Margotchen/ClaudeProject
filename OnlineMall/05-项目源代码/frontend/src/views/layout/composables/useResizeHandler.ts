import { onMounted, onBeforeMount, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

const { body } = document
const WIDTH = 1024
// 桌面端窄屏（1366px）自动折叠侧边栏
const COLLAPSE_WIDTH = 1366
const RATIO = 3
// 记录是否为自动折叠（区分用户手动操作）
let autoCollapsed = false
// 防抖定时器
let resizeTimer: ReturnType<typeof setTimeout> | null = null

export default function useResizeHandler() {
  const route = useRoute()
  const appStore = useAppStore()

  // 监听路由变化
  watch(
    () => route,
    () => {
      if (appStore.device === 'mobile' && appStore.sidebar.opened) {
        appStore.closeSideBar(false)
      }
    },
  )

  // 判断是否为移动端访问
  const isMobile = () => {
    const rect = body.getBoundingClientRect()
    return rect.width - RATIO < WIDTH
  }

  const handleResize = () => {
    if (document.hidden) return
    const mobile = isMobile()
    appStore.toggleDevice(mobile ? 'mobile' : 'desktop')

    if (mobile) {
      appStore.closeSideBar(true)
      return
    }
    // 桌面端：≤1366px 自动折叠，放宽后仅自动折叠的恢复展开
    const narrow = body.getBoundingClientRect().width <= COLLAPSE_WIDTH
    if (narrow && appStore.sidebar.opened && !autoCollapsed) {
      appStore.closeSideBar(true)
      autoCollapsed = true
    } else if (!narrow && autoCollapsed && !appStore.sidebar.opened) {
      appStore.toggleSideBar()
      autoCollapsed = false
    }
  }

  // 200ms 防抖，避免拖动窗口时抖动
  const resizeHandler = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(handleResize, 200)
  }

  // 在组件挂在之前调用
  onBeforeMount(() => {
    window.addEventListener('resize', resizeHandler)
  })

  // 在组件挂在之后调用
  onMounted(() => {
    const mobile = isMobile()
    if (mobile) {
      appStore.toggleDevice('mobile')
      appStore.closeSideBar(true)
    }
  })

  // 在组件卸载之前调用
  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeHandler)
  })

  return {
    isMobile,
    resizeHandler,
  }
}
