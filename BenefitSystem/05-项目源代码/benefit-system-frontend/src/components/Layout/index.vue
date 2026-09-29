<template>
  <el-container class="layout-container">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span>{{ collapsed ? '福利' : '福利申领系统' }}</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
      >
        <el-menu-item v-for="menu in permissionStore.menus" :key="menu.path" :index="menu.path">
          <el-icon>
            <component :is="menu.icon" />
          </el-icon>
          <template #title>{{ menu.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="handleToggle">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-tooltip :content="themeStore.theme === 'light' ? '切换深色主题' : '切换浅色主题'" placement="bottom">
            <el-icon class="theme-btn" @click="themeStore.toggleTheme()">
              <Sunny v-if="themeStore.theme === 'light'" />
              <Moon v-else />
            </el-icon>
          </el-tooltip>
          <span class="username">{{ userStore.userInfo?.realName }}（{{ roleName }}）</span>
          <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useThemeStore } from '@/stores/theme'
import { ROLES } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const themeStore = useThemeStore()

const roleName = computed(() => {
  return ROLES[userStore.roleCode] || userStore.roleCode
})

// 侧边栏折叠：≤1366px 自动折叠；userToggled 标记手动操作不被自动逻辑覆盖
const collapsed = ref(false)
const userToggled = ref(false)
const autoCollapsed = ref(false)

let resizeTimer = null

function checkWidth() {
  const small = window.innerWidth <= 1366
  if (small && !collapsed.value && !userToggled.value) {
    collapsed.value = true
    autoCollapsed.value = true
  } else if (!small && autoCollapsed.value) {
    collapsed.value = false
    autoCollapsed.value = false
    userToggled.value = false
  }
}

function handleResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(checkWidth, 200)
}

function handleToggle() {
  collapsed.value = !collapsed.value
  userToggled.value = true
  autoCollapsed.value = false
}

onMounted(() => {
  checkWidth()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(resizeTimer)
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s ease;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar :deep(.el-menu) {
  border-right: none;
}

.sidebar :deep(.el-menu-item.is-active) {
  background-color: var(--color-primary);
}

.header {
  background-color: var(--color-bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.collapse-btn:hover {
  color: var(--color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-btn {
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.theme-btn:hover {
  color: var(--color-primary);
}

.username {
  color: var(--color-text-secondary);
}

.main-content {
  background-color: var(--color-bg-base);
  padding: 20px;
  overflow-y: auto;
  transition: background-color 0.3s ease;
}
</style>
