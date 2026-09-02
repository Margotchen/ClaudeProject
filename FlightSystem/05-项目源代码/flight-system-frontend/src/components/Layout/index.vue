<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">FlightSystem</div>
      <el-menu
        :default-active="activeMenu"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-if="userStore.isPassenger">
          <el-menu-item index="/passenger/search">
            <el-icon><Search /></el-icon>
            <span>Flight Search</span>
          </el-menu-item>
          <el-menu-item index="/passenger/orders">
            <el-icon><Tickets /></el-icon>
            <span>My Orders</span>
          </el-menu-item>
        </template>

        <template v-if="userStore.isService">
          <el-menu-item index="/service/refunds">
            <el-icon><Refresh /></el-icon>
            <span>Refund / Change</span>
          </el-menu-item>
          <el-menu-item index="/service/orders">
            <el-icon><Tickets /></el-icon>
            <span>Passenger Orders</span>
          </el-menu-item>
        </template>

        <template v-if="userStore.isOperator">
          <el-menu-item index="/operator/flights">
            <el-icon><Promotion /></el-icon>
            <span>Flight Management</span>
          </el-menu-item>
          <el-menu-item index="/operator/status">
            <el-icon><InfoFilled /></el-icon>
            <span>Flight Status</span>
          </el-menu-item>
          <el-menu-item index="/operator/dashboard">
            <el-icon><DataLine /></el-icon>
            <span>Dashboard</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button text @click="showNotifications = true">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <span class="username">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
          <el-button text @click="logout">Logout</el-button>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <el-drawer v-model="showNotifications" title="Notifications" size="400px">
    <el-empty v-if="notifications.length === 0" description="No notifications" />
    <div v-for="n in notifications" :key="n.id" class="notification-item" :class="{ unread: !n.is_read }">
      <div class="notification-title">{{ n.title }}</div>
      <div class="notification-content">{{ n.content }}</div>
      <div class="notification-time">{{ formatDate(n.create_time) }}</div>
      <el-button v-if="!n.is_read" size="small" text @click="markRead(n)">Mark as read</el-button>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Tickets, Refresh, Promotion, InfoFilled, DataLine, Bell } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getUnreadCount, getNotifications, markAsRead } from '@/api/notification'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const showNotifications = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
let notificationTimer = null

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('en-US')
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
  await userStore.logout()
  ElMessage.success('Logged out')
  router.push('/login')
}

watch(showNotifications, (val) => {
  if (val) {
    loadNotifications()
  }
})

onMounted(() => {
  loadUnreadCount()
  notificationTimer = setInterval(loadUnreadCount, 30000)
})

onBeforeUnmount(() => {
  if (notificationTimer) clearInterval(notificationTimer)
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.menu {
  border-right: none;
}

.header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  margin-right: 10px;
}

.username {
  color: #606266;
  font-size: 14px;
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
}

.notification-item.unread {
  background-color: #f0f9ff;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.notification-content {
  color: #606266;
  font-size: 13px;
  margin-bottom: 8px;
}

.notification-time {
  color: #909399;
  font-size: 12px;
}
</style>
