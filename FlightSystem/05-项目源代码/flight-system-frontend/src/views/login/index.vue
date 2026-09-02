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
              clearable
            />
          </el-form-item>
          <el-form-item :label="$t('login.password')" prop="password">
            <el-input
              v-model="form.password"
              type="password"
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
    await userStore.login(form)
    ElMessage.success(t('login.success'))
    const redirect = route.query.redirect
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      router.push(redirect)
    } else {
      router.push('/')
    }
  } catch (err) {
    console.error(err)
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
  background: #f6f8fa;
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 360px;
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
  background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
  color: #fff;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(9, 105, 218, 0.25);
}

.brand-title {
  font-size: 24px;
  font-weight: 600;
  color: #24292f;
  margin: 0 0 4px;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 14px;
  color: #57606a;
  margin: 0;
}

.login-card {
  border-radius: 12px;
  border: 1px solid #d0d7de;
  background: #ffffff;
}

.login-card :deep(.el-card__body) {
  padding: 28px;
}

.login-card :deep(.el-form-item__label) {
  color: #24292f;
  font-weight: 500;
  padding-bottom: 6px;
}

.login-card :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #d0d7de inset;
  transition: box-shadow 0.2s;
}

.login-card :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #0969da33, 0 0 0 1px #0969da inset;
}

.login-card :deep(.el-button--primary) {
  border-radius: 8px;
  font-weight: 600;
  background: #0969da;
  border-color: #0969da;
  transition: background 0.2s, border-color 0.2s;
}

.login-card :deep(.el-button--primary:hover) {
  background: #0550ae;
  border-color: #0550ae;
}

.login-footer {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
