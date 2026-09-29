<template>
  <el-container class="layout-container">
    <el-aside :width="collapsed ? '64px' : '240px'" class="sidebar">
      <div class="logo" @click="toggleSidebar">
        <span class="logo-icon">✈</span>
        <span v-show="!collapsed">{{ $t('common.appName') }}</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="menu"
      >
        <template v-if="userStore.isPassenger">
          <el-menu-item index="/passenger/search">
            <el-icon><Search /></el-icon>
            <template #title>{{ $t('menu.flightSearch') }}</template>
          </el-menu-item>
          <el-menu-item index="/passenger/orders">
            <el-icon><Tickets /></el-icon>
            <template #title>{{ $t('menu.myOrders') }}</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.isService">
          <el-menu-item index="/service/refunds">
            <el-icon><Refresh /></el-icon>
            <template #title>{{ $t('menu.refundChange') }}</template>
          </el-menu-item>
          <el-menu-item index="/service/orders">
            <el-icon><Tickets /></el-icon>
            <template #title>{{ $t('menu.passengerOrders') }}</template>
          </el-menu-item>
        </template>

        <template v-if="userStore.isOperator">
          <el-menu-item index="/operator/flights">
            <el-icon><Promotion /></el-icon>
            <template #title>{{ $t('menu.flightManagement') }}</template>
          </el-menu-item>
          <el-menu-item index="/operator/status">
            <el-icon><InfoFilled /></el-icon>
            <template #title>{{ $t('menu.flightStatus') }}</template>
          </el-menu-item>
          <el-menu-item index="/operator/dashboard">
            <el-icon><DataLine /></el-icon>
            <template #title>{{ $t('menu.dashboard') }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Expand v-if="collapsed" />
            <Fold v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-tooltip :content="themeStore.theme === 'light' ? $t('common.toDark') : $t('common.toLight')" placement="bottom">
            <el-button text @click="themeStore.toggleTheme()">
              <el-icon><Sunny v-if="themeStore.theme === 'dark'" /><Moon v-else /></el-icon>
            </el-button>
          </el-tooltip>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button text @click="showNotifications = true">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <LanguageSwitch />
          <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
          <el-button text @click="logout">{{ $t('common.logout') }}</el-button>
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

  <el-drawer v-model="showNotifications" :title="$t('common.notifications')" size="400px">
    <el-empty v-if="notifications.length === 0" :description="$t('common.noNotifications')" />
    <div v-for="n in notifications" :key="n.id" class="notification-item" :class="{ unread: !n.is_read }">
      <div class="notification-title">{{ n.title }}</div>
      <div class="notification-content">{{ n.content }}</div>
      <div class="notification-time">{{ formatDateTime(n.create_time) }}</div>
      <el-button v-if="!n.is_read" size="small" text @click="markRead(n)">{{ $t('common.markAsRead') }}</el-button>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Tickets, Refresh, Promotion, InfoFilled, DataLine, Bell, Sunny, Moon, Expand, Fold } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useI18nHelpers } from '@/composables/useI18nHelpers'
import { getUnreadCount, getNotifications, markAsRead } from '@/api/notification'
import LanguageSwitch from '@/components/LanguageSwitch.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()
const { t, formatDateTime } = useI18nHelpers()

const activeMenu = computed(() => route.path)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
let notificationTimer = null

// 侧边栏折叠：1366px 以下自动折叠，手动操作优先且不被自动逻辑覆盖
const collapsed = ref(false)
const userToggled = ref(false)
const autoCollapsed = ref(false)
let resizeTimer = null

function handleResize() {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    const narrow = window.innerWidth <= 1366
    if (narrow && !collapsed.value && !userToggled.value) {
      collapsed.value = true
      autoCollapsed.value = true
    } else if (!narrow && autoCollapsed.value) {
      collapsed.value = false
      autoCollapsed.value = false
    }
  }, 200)
}

function toggleSidebar() {
  collapsed.value = !collapsed.value
  userToggled.value = true
  autoCollapsed.value = false
}

const loadNotifications = async () => {
  try {
    const res = await getNotifications({ pageSize: 20 })
    notifications.value = res.data.list
  } catch (err) {
    console.error(err)
  }
}

const loadUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data.count
  } catch (err) {
    console.error(err)
  }
}

const markRead = async (n) => {
  try {
    await markAsRead(n.id)
    n.is_read = 1
    loadUnreadCount()
  } catch (err) {
    console.error(err)
  }
}

const logout = async () => {
  if (notificationTimer) {
    clearInterval(notificationTimer)
    notificationTimer = null
  }
  try {
    await userStore.logout()
    ElMessage.success(t('common.logoutSuccess'))
    router.push('/login')
  } catch (err) {
    ElMessage.error(err?.message || t('common.logoutFailed'))
  }
}

watch(showNotifications, (val) => {
  if (val) {
    loadNotifications()
  }
})

onMounted(() => {
  loadUnreadCount()
  notificationTimer = setInterval(loadUnreadCount, 30000)
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (notificationTimer) clearInterval(notificationTimer)
  clearTimeout(resizeTimer)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-x: hidden;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 20px;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  white-space: nowrap;
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-end) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.menu {
  border-right: none;
  background: transparent;
  padding: 12px;
}

.menu :deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  border-radius: 8px;
  margin-bottom: 4px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.menu :deep(.el-menu-item:hover) {
  background-color: var(--color-bg-hover);
}

.menu :deep(.el-menu-item.is-active) {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.menu :deep(.el-menu-item .el-icon) {
  color: var(--color-text-secondary);
}

.menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--color-primary);
}

.header {
  background-color: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
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

.notification-badge {
  margin-right: 4px;
}

.username {
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.main-content {
  background-color: var(--color-bg-base);
  overflow-y: auto;
  padding: 24px;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid var(--color-border);
}

.notification-item.unread {
  background-color: var(--color-primary-light);
}

.notification-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--color-text-primary);
}

.notification-content {
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

.notification-time {
  color: var(--color-text-placeholder);
  font-size: 12px;
}
</style>
