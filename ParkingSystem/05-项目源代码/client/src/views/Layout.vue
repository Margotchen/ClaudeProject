<template>
  <el-container class="layout-container">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="toggleSidebar">
        <el-icon><OfficeBuilding /></el-icon>
        <span v-show="!collapsed">停车预约系统</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <template #title>数据看板</template>
        </el-menu-item>

        <el-menu-item index="/parking-map">
          <el-icon><MapLocation /></el-icon>
          <template #title>车位地图</template>
        </el-menu-item>

        <el-sub-menu index="/my">
          <template #title>
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/my-reservations">我的预约</el-menu-item>
          <el-menu-item index="/my-vehicles">我的车辆</el-menu-item>
        </el-sub-menu>

        <template v-if="userStore.hasRole(['parking_admin', 'system_admin'])">
          <el-sub-menu index="/manage">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理后台</span>
            </template>
            <el-menu-item index="/reservations">预约管理</el-menu-item>
            <el-menu-item index="/spots">车位管理</el-menu-item>
            <el-menu-item index="/violations">违约管理</el-menu-item>
            <el-menu-item index="/statistics">统计报表</el-menu-item>
          </el-sub-menu>
        </template>

        <template v-if="userStore.hasRole(['system_admin'])">
          <el-sub-menu index="/system">
            <template #title>
              <el-icon><Tools /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/users">用户管理</el-menu-item>
            <el-menu-item index="/system-config">系统配置</el-menu-item>
            <el-menu-item index="/logs">操作日志</el-menu-item>
          </el-sub-menu>
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
          <Breadcrumb />
        </div>
        <div class="header-right">
          <el-tooltip :content="themeStore.theme === 'light' ? '切换深色模式' : '切换浅色模式'" placement="bottom">
            <el-icon class="theme-btn" @click="themeStore.toggleTheme()">
              <Sunny v-if="themeStore.theme === 'dark'" />
              <Moon v-else />
            </el-icon>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ userStore.userInfo.realName }}（{{ roleText }}）
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';
import { useThemeStore } from '@/store/theme';
import Breadcrumb from '@/components/Breadcrumb.vue';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

const activeMenu = computed(() => route.path);

// 侧边栏折叠：1366px 以下自动折叠，手动操作优先且不被自动逻辑覆盖
const collapsed = ref(false);
const userToggled = ref(false);
const autoCollapsed = ref(false);
let resizeTimer = null;

function handleResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const narrow = window.innerWidth <= 1366;
    if (narrow && !collapsed.value && !userToggled.value) {
      collapsed.value = true;
      autoCollapsed.value = true;
    } else if (!narrow && autoCollapsed.value) {
      collapsed.value = false;
      autoCollapsed.value = false;
    }
  }, 200);
}

function toggleSidebar() {
  collapsed.value = !collapsed.value;
  userToggled.value = true;
  autoCollapsed.value = false;
}

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  clearTimeout(resizeTimer);
  window.removeEventListener('resize', handleResize);
});

const roleText = computed(() => {
  const map = {
    employee: '员工',
    parking_admin: '车位管理员',
    system_admin: '系统管理员'
  };
  return map[userStore.userInfo.role] || '员工';
});

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    userStore.clearUser();
    ElMessage.success('已退出登录');
    router.push('/login');
  } catch {
    // 取消
  }
}

function handleCommand(command) {
  if (command === 'logout') {
    handleLogout();
  }
}
</script>

<style scoped lang="scss">
.layout-container {
  min-height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s ease;
  overflow-x: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid #1f2d3d;
    cursor: pointer;
    white-space: nowrap;

    .el-icon {
      font-size: 24px;
      margin-right: 8px;
      flex-shrink: 0;
    }
  }

  .el-menu {
    border-right: none;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-bg-card);
  box-shadow: var(--shadow-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.collapse-btn,
.theme-btn {
  font-size: 18px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color 0.3s ease;

  &:hover {
    color: var(--color-primary);
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  cursor: pointer;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.main-content {
  background-color: var(--color-bg-base);
  padding: 20px;
}
</style>
