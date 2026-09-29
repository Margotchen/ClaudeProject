<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">{{ collapsed ? '档' : '员工档案系统' }}</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/employees">
          <el-icon><User /></el-icon>
          <template #title>员工档案</template>
        </el-menu-item>
        <el-menu-item index="/reminders">
          <el-icon><Bell /></el-icon>
          <template #title>提醒中心</template>
        </el-menu-item>
        <el-menu-item index="/org">
          <el-icon><PieChart /></el-icon>
          <template #title>组织架构</template>
        </el-menu-item>
        <el-menu-item index="/history">
          <el-icon><Clock /></el-icon>
          <template #title>变动历史</template>
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
          <span class="title">企业人力资源档案管理平台</span>
        </div>
        <div class="user-info" v-if="user">
          <el-tooltip :content="themeState.theme === 'light' ? '切换深色主题' : '切换浅色主题'" placement="bottom">
            <el-icon class="theme-btn" @click="toggleTheme">
              <Sunny v-if="themeState.theme === 'light'" />
              <Moon v-else />
            </el-icon>
          </el-tooltip>
          <el-icon><UserFilled /></el-icon>
          <span class="username">{{ user.username }}</span>
          <el-tag size="small" type="info">{{ user.role }}</el-tag>
          <el-button type="danger" link size="small" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="main">
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
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { themeState, toggleTheme } from '../utils/theme';

const route = useRoute();
const router = useRouter();
const activeMenu = computed(() => route.path);

const user = ref(null);

// 侧边栏折叠：≤1366px 自动折叠；userToggled 标记手动操作不被自动逻辑覆盖
const collapsed = ref(false);
const userToggled = ref(false);
const autoCollapsed = ref(false);

let resizeTimer = null;

function checkWidth() {
  const small = window.innerWidth <= 1366;
  if (small && !collapsed.value && !userToggled.value) {
    collapsed.value = true;
    autoCollapsed.value = true;
  } else if (!small && autoCollapsed.value) {
    collapsed.value = false;
    autoCollapsed.value = false;
    userToggled.value = false;
  }
}

function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(checkWidth, 200);
}

function handleToggle() {
  collapsed.value = !collapsed.value;
  userToggled.value = true;
  autoCollapsed.value = false;
}

onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      user.value = JSON.parse(userStr);
    } catch (e) {
      user.value = null;
    }
  }
  checkWidth();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  clearTimeout(resizeTimer);
});

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
}
.sidebar {
  background-color: #304156;
  transition: width 0.3s ease;
  overflow: hidden;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
  white-space: nowrap;
  overflow: hidden;
}
.menu {
  border-right: none;
}
.menu:not(.el-menu--collapse) {
  width: 220px;
}
.menu :deep(.el-menu-item.is-active) {
  background-color: var(--color-primary);
}
.header {
  background-color: var(--color-bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.3s ease;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
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
.title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.theme-btn {
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-secondary);
  margin-right: 8px;
  transition: color 0.3s ease;
}
.theme-btn:hover {
  color: var(--color-primary);
}
.username {
  font-size: 14px;
  color: var(--color-text-secondary);
}
.main {
  background-color: var(--color-bg-base);
  padding: 20px;
  transition: background-color 0.3s ease;
}
</style>
