<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBuyerStore } from '@/stores/buyer'
import { HomeFilled, ShoppingCart, List, UserFilled } from '@element-plus/icons-vue'

defineOptions({
  name: 'BuyerLayout'
})

const route = useRoute()
const router = useRouter()
const buyerStore = useBuyerStore()

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/buyer/profile')) return 'profile'
  if (path.startsWith('/buyer/cart')) return 'cart'
  if (path.startsWith('/buyer/order')) return 'order'
  return 'index'
})

const goBack = () => {
  router.back()
}

const tabs = [
  { name: 'index', label: '首页', icon: HomeFilled, path: '/buyer/index' },
  { name: 'cart', label: '购物车', icon: ShoppingCart, path: '/buyer/cart' },
  { name: 'order', label: '订单', icon: List, path: '/buyer/order/list' },
  { name: 'profile', label: '我的', icon: UserFilled, path: '/buyer/profile' },
]

const switchTab = (path: string) => {
  router.push(path)
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/buyer/index': '商城首页',
    '/buyer/cart': '购物车',
    '/buyer/order/list': '我的订单',
    '/buyer/order/confirm': '确认订单',
    '/buyer/profile': '个人中心',
  }
  return titles[route.path] || '商城'
})

const showBack = computed(() => {
  return route.path !== '/buyer/index'
})
</script>

<template>
  <div class="buyer-layout">
    <!-- 顶部导航 -->
    <header class="buyer-header">
      <div class="header-left">
        <el-icon v-if="showBack" class="back-icon" @click="goBack">
          <ArrowLeftBold />
        </el-icon>
      </div>
      <h1 class="header-title">{{ pageTitle }}</h1>
      <div class="header-right"></div>
    </header>

    <!-- 主内容区 -->
    <main class="buyer-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部 Tab 导航 -->
    <nav class="buyer-tabbar">
      <div v-for="tab in tabs" :key="tab.name" class="tab-item" :class="{ active: activeTab === tab.name }"
        @click="switchTab(tab.path)">
        <el-icon class="tab-icon">
          <component :is="tab.icon" />
        </el-icon>
        <span class="tab-label">{{ tab.label }}</span>
      </div>
    </nav>
  </div>
</template>

<script lang="ts">
import { ArrowLeftBold } from '@element-plus/icons-vue'
export default {
  components: { ArrowLeftBold }
}
</script>

<style scoped>
.buyer-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.buyer-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  background: linear-gradient(135deg, #ff5000 0%, #ff9000 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 80, 0, 0.2);
}

.header-left {
  width: 24px;
  display: flex;
  align-items: center;
}

.back-icon {
  font-size: 20px;
  cursor: pointer;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  width: 24px;
}

.buyer-main {
  flex: 1;
  padding-bottom: 60px;
  overflow-x: hidden;
}

.buyer-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  background: #fff;
  border-top: 1px solid #eee;
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: #999;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-item.active {
  color: #ff5000;
}

.tab-icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.tab-label {
  font-size: 11px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (min-width: 768px) {
  .buyer-layout {
    max-width: 750px;
    margin: 0 auto;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.08);
  }
}
</style>
