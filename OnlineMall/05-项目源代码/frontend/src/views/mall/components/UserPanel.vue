<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { Avatar } from '@element-plus/icons-vue'

defineOptions({
  name: 'UserPanel'
})

const emit = defineEmits<{
  (e: 'login'): void
  (e: 'logout'): void
}>()

const userStore = useUserStore()
const isLogin = computed(() => !!userStore.userInfo.token)
const username = computed(() => userStore.userInfo.username || '')
const avatar = computed(() => userStore.userInfo.avatar || '')
const defaultAvatarText = computed(() => {
  const name = username.value || 'U'
  return name.charAt(0).toUpperCase()
})

const handleLogin = () => {
  emit('login')
}

const handleLogout = () => {
  emit('logout')
}
</script>

<template>
  <div class="user-panel">
    <div v-if="!isLogin" class="guest-card">
      <el-avatar :size="64" :icon="Avatar" class="guest-avatar" />
      <p class="guest-tip">登录后查看订单与收藏</p>
      <el-button type="primary" class="login-btn" @click="handleLogin">
        立即登录
      </el-button>
    </div>
    <div v-else class="user-card">
      <div class="user-header">
        <el-avatar class="user-avatar" :size="64" :src="avatar" fit="cover">
          {{ defaultAvatarText }}
        </el-avatar>
        <div class="user-info">
          <div class="user-name">{{ username }}</div>
          <div class="user-role">欢迎回来</div>
        </div>
      </div>
      <div class="user-actions">
        <router-link to="/" class="action-link">
          <el-button type="primary" plain class="action-btn">进入后台</el-button>
        </router-link>
        <el-button class="action-btn" @click="handleLogout">退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-panel {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.guest-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.guest-avatar {
  background-color: #ffece3;
  color: #ff5000;
  font-size: 28px;
}

.guest-tip {
  margin: 12px 0 16px;
  font-size: 13px;
  color: #999;
}

.login-btn {
  width: 100%;
  background-color: #ff5000;
  border-color: #ff5000;
  font-size: 14px;
}

.login-btn:hover {
  background-color: #e64a00;
  border-color: #e64a00;
}

.user-card {
  display: flex;
  flex-direction: column;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-avatar {
  border-radius: 50%;
  background-color: #ff5000;
  color: #fff;
  font-weight: bold;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.user-role {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  width: 100%;
}

.action-link {
  display: block;
  width: 100%;
}
</style>
