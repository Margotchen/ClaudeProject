<template>
  <div class="not-found">
    <div class="not-found-code">404</div>
    <h2 class="not-found-title">{{ $t('notFound.title') }}</h2>
    <p class="not-found-desc">{{ $t('notFound.desc') }}</p>
    <el-button type="primary" @click="goHome">{{ $t('notFound.backHome') }}</el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getHomeByRole } from '@/router'

const router = useRouter()
const userStore = useUserStore()

const goHome = () => {
  router.push(getHomeByRole(userStore.roleCode) || '/login')
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--color-bg-base);
}

.not-found-code {
  font-size: 72px;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
}

.not-found-title {
  font-size: 20px;
  color: var(--color-text-primary);
}

.not-found-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}
</style>
