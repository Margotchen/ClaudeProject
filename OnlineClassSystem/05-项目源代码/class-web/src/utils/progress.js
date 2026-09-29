import { reactive } from 'vue'

// 全局顶部路由进度条状态（TopProgress.vue 渲染，router 守卫驱动）
export const progress = reactive({ visible: false, percent: 0 })

let trickleTimer = null

export function startProgress() {
  progress.visible = true
  progress.percent = 0
  clearInterval(trickleTimer)
  // 模拟缓动爬升：快速到 70%，之后减速，上限 90%（等待真实完成）
  trickleTimer = setInterval(() => {
    const step = progress.percent < 70 ? 12 : (90 - progress.percent) * 0.08
    progress.percent = Math.min(90, progress.percent + step)
  }, 120)
}

export function finishProgress() {
  clearInterval(trickleTimer)
  trickleTimer = null
  progress.percent = 100
  setTimeout(() => {
    progress.visible = false
    progress.percent = 0
  }, 250)
}
