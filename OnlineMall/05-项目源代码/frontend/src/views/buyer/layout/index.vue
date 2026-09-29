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
      <div class="header-inner">
        <div class="header-left">
          <el-icon v-if="showBack" class="back-icon" @click="goBack">
            <ArrowLeftBold />
          </el-icon>
          <div class="logo" @click="switchTab('/buyer/index')">精选商城</div>
        </div>
        <h1 class="header-title">{{ pageTitle }}</h1>
        <!-- PC 端顶部菜单 -->
        <nav class="header-nav">
          <div v-for="tab in tabs" :key="tab.name" class="nav-item" :class="{ active: activeTab === tab.name }"
            @click="switchTab(tab.path)">
            {{ tab.label }}
          </div>
        </nav>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="buyer-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 底部 Tab 导航（仅移动端显示） -->
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

<style scoped lang="scss">
.buyer-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $buyer-bg;
}

.buyer-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 50px;
  background: $buyer-dark;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: $buyer-text-on-dark;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  display: none;
}

.back-icon {
  font-size: 20px;
  cursor: pointer;
  color: $buyer-text-on-dark-dim;
  transition: color 0.2s;
}

.back-icon:hover {
  color: $buyer-text-on-dark;
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  margin: 0;
}

.header-nav {
  display: none;
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
  background: $buyer-dark;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: $buyer-text-on-dark-dim;
  cursor: pointer;
  transition: color 0.2s;
}

.tab-item.active {
  color: $buyer-accent;
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

/* PC 端布局 */
@media (min-width: 768px) {
  .buyer-header {
    height: 64px;
  }

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .logo {
    display: block;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
    color: $buyer-text-on-dark;
    cursor: pointer;
  }

  .logo::first-letter {
    color: $buyer-accent;
  }

  .back-icon {
    display: none;
  }

  .header-title {
    display: none;
  }

  .header-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
  }

  .nav-item {
    position: relative;
    padding: 0 18px;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 15px;
    color: $buyer-text-on-dark-dim;
    cursor: pointer;
    transition: color 0.2s;
  }

  .nav-item:hover {
    color: $buyer-text-on-dark;
  }

  .nav-item.active {
    color: $buyer-accent;
  }

  .nav-item.active::after {
    content: '';
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 0;
    height: 3px;
    border-radius: 2px 2px 0 0;
    background: linear-gradient(90deg, $buyer-accent, $buyer-accent-strong);
  }

  .buyer-main {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding-bottom: 40px;
  }

  .buyer-tabbar {
    display: none;
  }
}
</style>
