<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, Document, Location, Phone, Shop } from '@element-plus/icons-vue'
import { useBuyerStore } from '@/stores/buyer'

defineOptions({
  name: 'BuyerProfile'
})

const router = useRouter()
const buyerStore = useBuyerStore()

const isLogin = computed(() => !!buyerStore.token)

const displayName = computed(() => {
  return buyerStore.buyerInfo.nickname || buyerStore.buyerInfo.username || '游客'
})

const logout = () => {
  buyerStore.buyerLogout()
  router.replace('/buyer/login')
}

const menuList = [
  { label: '我的订单', icon: Document, path: '/buyer/order/list' },
  { label: '收货地址', icon: Location, path: '#' },
  { label: '联系客服', icon: Phone, path: '#' },
  { label: '设置', icon: Setting, path: '#' },
]

const goMenu = (path: string) => {
  if (path === '#') {
    return
  }
  router.push(path)
}

const goLogin = () => {
  router.push('/buyer/login')
}
</script>

<template>
  <div class="buyer-profile">
    <div class="profile-header">
      <div class="avatar">
        <el-avatar v-if="buyerStore.buyerInfo.icon" :size="64" :src="buyerStore.buyerInfo.icon" />
        <el-avatar v-else :size="64" :icon="Shop" />
      </div>
      <div class="profile-info">
        <h2 class="profile-name">{{ displayName }}</h2>
        <p v-if="isLogin" class="profile-phone">{{ buyerStore.buyerInfo.phone || '暂无手机号' }}</p>
        <p v-else class="profile-tip">登录后享受更多权益</p>
      </div>
      <el-button v-if="isLogin" type="primary" plain size="small" @click="logout">退出登录</el-button>
      <el-button v-else type="primary" size="small" @click="goLogin">登录 / 注册</el-button>
    </div>

    <div class="profile-stats">
      <div class="stat-item">
        <span class="stat-value">{{ buyerStore.buyerInfo.integration || 0 }}</span>
        <span class="stat-label">积分</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ buyerStore.buyerInfo.growth || 0 }}</span>
        <span class="stat-label">成长值</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">0</span>
        <span class="stat-label">优惠券</span>
      </div>
    </div>

    <div class="profile-menu">
      <div v-for="menu in menuList" :key="menu.label" class="menu-item" @click="goMenu(menu.path)">
        <el-icon class="menu-icon"><component :is="menu.icon" /></el-icon>
        <span class="menu-label">{{ menu.label }}</span>
        <el-icon class="menu-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
export default {
  components: { ArrowRight }
}
</script>

<style scoped>
.buyer-profile {
  min-height: 100%;
  padding: 16px;
  background: #f5f5f5;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, #ff5000 0%, #ff9000 100%);
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  margin-bottom: 14px;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
}

.profile-phone,
.profile-tip {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

.profile-stats {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 16px 0;
  margin-bottom: 14px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid #f5f5f5;
}

.stat-item:last-child {
  border-right: none;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.profile-menu {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 20px;
  color: #ff5000;
  margin-right: 12px;
}

.menu-label {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.menu-arrow {
  color: #ccc;
}
</style>
