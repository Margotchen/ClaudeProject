<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="logo">
      <el-icon :size="26" color="#fff"><Platform /></el-icon>
      <span v-show="!collapsed" class="logo-text">在线课堂</span>
    </div>
    <el-menu
      :default-active="$route.path"
      :collapse="collapsed"
      :collapse-transition="false"
      router
      class="sidebar-menu"
    >
      <el-menu-item v-for="item in visibleMenus" :key="item.path" :index="item.path">
        <el-icon><component :is="item.meta.icon" /></el-icon>
        <template #title>{{ item.meta.title }}</template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { Platform } from '@element-plus/icons-vue'
import { routes } from '../../router'
import { useUserStore } from '../../store/user'

defineProps({ collapsed: Boolean })

const userStore = useUserStore()

// 按角色过滤侧边栏菜单
const visibleMenus = computed(() => {
  const root = routes.find((r) => r.path === '/')
  if (!root) return []
  return root.children
    .filter((r) => !r.meta?.hidden && r.meta?.roles?.includes(userStore.roleCode))
    .map((r) => ({ ...r, path: `/${r.path}` }))
})
</script>

<style lang="scss" scoped>
.sidebar {
  width: 210px;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;

  &.collapsed {
    width: 64px;
  }

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-end));
    overflow: hidden;
    white-space: nowrap;

    .logo-text {
      color: #fff;
      font-size: 17px;
      font-weight: 600;
    }
  }

  .sidebar-menu {
    flex: 1;
    border-right: none;
    background: transparent;
    --el-menu-bg-color: transparent;
    --el-menu-text-color: var(--color-text-secondary);
    --el-menu-hover-bg-color: var(--color-primary-light);
    --el-menu-active-color: var(--color-primary);

    .el-menu-item {
      &.is-active {
        background: var(--color-primary-light);
        border-left: 3px solid var(--color-primary);
      }
    }
  }
}
</style>
