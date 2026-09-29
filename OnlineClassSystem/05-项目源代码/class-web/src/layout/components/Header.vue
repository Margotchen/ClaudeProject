<template>
  <header class="header">
    <div class="header-left">
      <el-icon class="collapse-btn" :size="18" @click="$emit('toggle-collapse')">
        <Expand v-if="collapsed" />
        <Fold v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-tooltip :content="themeStore.theme === 'light' ? '切换到深色模式' : '切换到浅色模式'">
        <el-switch
          :model-value="themeStore.theme === 'dark'"
          inline-prompt
          :active-icon="Moon"
          :inactive-icon="Sunny"
          @change="themeStore.toggleTheme()"
        />
      </el-tooltip>
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-avatar :size="30">{{ avatarText }}</el-avatar>
          <span class="user-name">{{ userStore.userInfo?.realName }}</span>
          <el-tag size="small" effect="plain">{{ userStore.userInfo?.roleName }}</el-tag>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Expand, Fold, Moon, Sunny } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import { useThemeStore } from '../../store/theme'

defineProps({ collapsed: Boolean })
defineEmits(['toggle-collapse'])

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const avatarText = computed(() => userStore.userInfo?.realName?.slice(0, 1) || '?')

async function handleCommand(command) {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.header {
  height: 60px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

    .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      cursor: pointer;
      color: var(--color-text-secondary);
      transition: all 0.3s ease;

      &:hover {
        color: var(--color-primary);
      }
    }

    /* 小屏隐藏面包屑，避免挤压 */
    @media (max-width: 1366px) {
      .el-breadcrumb {
        display: none;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .user-name {
        color: var(--color-text-primary);
      }
    }

    /* 小屏隐藏角色标签 */
    @media (max-width: 1366px) {
      .el-tag {
        display: none;
      }
    }
  }
}
</style>
