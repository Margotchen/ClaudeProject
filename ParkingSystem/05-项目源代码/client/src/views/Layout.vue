<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon><OfficeBuilding /></el-icon>
        <span>停车预约系统</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>数据看板</span>
        </el-menu-item>

        <el-menu-item index="/parking-map">
          <el-icon><MapLocation /></el-icon>
          <span>车位地图</span>
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
          <breadcrumb />
        </div>
        <div class="header-right">
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
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeMenu = computed(() => route.path);

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

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid #1f2d3d;

    .el-icon {
      font-size: 24px;
      margin-right: 8px;
    }
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.user-info {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
