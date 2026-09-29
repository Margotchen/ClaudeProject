<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBuyerStore } from '@/stores/buyer'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

defineOptions({
  name: 'BuyerLogin'
})

const router = useRouter()
const buyerStore = useBuyerStore()
const loading = ref(false)
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = reactive<FormRules<typeof loginForm>>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const handleLogin = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await buyerStore.buyerLogin({
        username: loginForm.username,
        password: loginForm.password
      })
      router.replace('/buyer/index')
    } catch (err) {
      console.error('买家登录失败:', err)
    } finally {
      loading.value = false
    }
  })
}

const goRegister = () => {
  router.push('/buyer/register')
}
</script>

<template>
  <div class="buyer-login-page">
    <div class="login-header">
      <svg-icon icon-class="login-mall" class="login-logo"></svg-icon>
      <h2 class="login-title">买家登录</h2>
      <p class="login-subtitle">欢迎来到商城，尽享购物乐趣</p>
    </div>

    <div class="login-form-wrapper">
      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-position="top">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password
            @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form>

      <div class="login-footer">
        <span class="register-tip">还没有账号？</span>
        <el-button type="primary" link @click="goRegister">立即注册</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.buyer-login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $buyer-bg;
  padding: 20px;
}

.login-header {
  text-align: center;
  padding: 60px 0 40px;
}

.login-logo {
  width: 64px;
  height: 64px;
  color: $buyer-price;
}

.login-title {
  margin: 16px 0 8px;
  font-size: 24px;
  color: $buyer-text-1;
}

.login-subtitle {
  margin: 0;
  font-size: 14px;
  color: $buyer-text-3;
}

.login-form-wrapper {
  background: $buyer-card;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $buyer-shadow-card;
}

.login-button {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  font-size: 16px;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, $buyer-price 0%, #b34e2c 100%);
}

.login-button:hover {
  color: #fff;
  background: linear-gradient(135deg, #b34e2c 0%, $buyer-price 100%);
}

.login-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: $buyer-text-2;
}

.register-tip {
  margin-right: 4px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: $buyer-text-1;
}

@media (min-width: 768px) {
  .buyer-login-page {
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, $buyer-dark 0%, $buyer-dark-deep 100%);
    padding: 40px 20px;
  }

  .login-header {
    padding: 0 0 32px;
  }

  .login-logo {
    color: $buyer-accent;
  }

  .login-title {
    color: $buyer-text-on-dark;
    letter-spacing: 2px;
  }

  .login-subtitle {
    color: $buyer-text-on-dark-dim;
  }

  .login-form-wrapper {
    width: 420px;
    padding: 32px;
  }
}
</style>
