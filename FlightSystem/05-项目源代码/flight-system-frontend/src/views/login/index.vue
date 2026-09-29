<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-brand">
        <div class="brand-mark">✈</div>
        <h1 class="brand-title">{{ $t('common.appName') }}</h1>
        <p class="brand-subtitle">{{ $t('login.title') }}</p>
      </div>

      <el-card class="login-card" shadow="never">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @submit.prevent="handleLogin"
        >
          <el-form-item :label="$t('login.username')" prop="username">
            <el-input
              v-model="form.username"
              :placeholder="$t('login.usernamePlaceholder')"
              autocomplete="off"
              name="username"
              clearable
            />
          </el-form-item>
          <el-form-item :label="$t('login.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              name="password"
              show-password
              :placeholder="$t('login.passwordPlaceholder')"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              style="width: 100%"
              @click="handleLogin"
            >
              {{ $t('common.login') }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <footer class="login-footer">
        <LanguageSwitch />
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { getHomeByRole } from '@/router'
import LanguageSwitch from '@/components/LanguageSwitch.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: t('login.usernamePlaceholder'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.passwordPlaceholder'), trigger: 'blur' }]
}

const formRef = ref()
const loading = ref(false)

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    const user = await userStore.login({ ...form })
    ElMessage.success(t('login.success'))
    form.password = ''
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      router.push(redirect)
    } else {
      const home = getHomeByRole(user.roleCode) || '/passenger/search'
      router.push(home)
    }
  } catch (err) {
    ElMessage.error(err?.message || t('login.failed'))
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-base);
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 360px;
  animation: card-in 0.4s ease;
}

.login-brand {
  text-align: center;
  margin-bottom: 24px;
}

.brand-mark {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-end) 100%);
  color: #fff;
  font-size: 28px;
  box-shadow: var(--shadow-card-hover);
}

.brand-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.login-card {
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.login-card :deep(.el-card__body) {
  padding: 28px;
}

.login-card :deep(.el-form-item__label) {
  color: var(--color-text-primary);
  font-weight: 500;
  padding-bottom: 6px;
}

.login-card :deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.login-footer {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
