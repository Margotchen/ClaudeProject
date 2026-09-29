<template>
  <div class="layout-container">
    <Sidebar :collapsed="collapsed" />
    <div class="main-wrapper">
      <Header :collapsed="collapsed" @toggle-collapse="handleToggle" />
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

const collapsed = ref(false)
// 用户手动切换后不再自动覆盖（直到跨越断点方向改变）
let userToggled = false
let autoCollapsed = false

function handleToggle() {
  userToggled = true
  collapsed.value = !collapsed.value
}

let resizeTimer = null
function checkWidth() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    const small = window.innerWidth <= 1366
    if (small && !collapsed.value && !userToggled) {
      collapsed.value = true
      autoCollapsed = true
    } else if (!small && autoCollapsed) {
      // 仅恢复"自动折叠"的，用户手动折叠的不动
      collapsed.value = false
      autoCollapsed = false
      userToggled = false
    }
    if (!small) userToggled = false
  }, 200)
}

onMounted(() => {
  checkWidth()
  window.addEventListener('resize', checkWidth)
})

onBeforeUnmount(() => {
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', checkWidth)
})
</script>

<style lang="scss" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  overflow: hidden;

  .main-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: var(--color-bg-base);
    }
  }
}
</style>
