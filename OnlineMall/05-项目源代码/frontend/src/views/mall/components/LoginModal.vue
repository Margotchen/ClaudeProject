<script setup lang="ts">
import { reactive, ref } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { isvalidUsername } from '@/utils/validate'
import type { FormInstance, FormRules } from 'element-plus'

defineOptions({
  name: 'LoginModal'
})

const visible = defineModel<boolean>({ required: true })

const userStore = useUserStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const validateUsername = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!isvalidUsername(value)) {
    callback(new Error('请输入正确的用户名'))
  } else {
    callback()
  }
}

const validatePass = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!value || value.length < 3) {
    callback(new Error('密码不能小于3位'))
  } else {
    callback()
  }
}

const loginRules = reactive<FormRules<typeof loginForm>>({
  username: [{ required: true, trigger: 'blur', validator: validateUsername }],
  password: [{ required: true, trigger: 'blur', validator: validatePass }]
})

const handleLogin = () => {
  loginFormRef.value?.validate(async (valid) => {
    if (!valid) {
      return
    }
    loading.value = true
    try {
      await userStore.userLogin({
        username: loginForm.username.trim(),
        password: loginForm.password
      })
      visible.value = false
      // 刷新页面以触发路由守卫重新生成动态路由并更新商城状态
      location.reload()
    } catch (err) {
      console.error('登录失败:', err)
    } finally {
      loading.value = false
    }
  })
}

const handleClose = () => {
  loginForm.username = ''
  loginForm.password = ''
  loginFormRef.value?.resetFields()
}
</script>

<template>
  <el-dialog v-model="visible" width="360px" :close-on-click-modal="false" :show-close="true"
    align-center destroy-on-close @close="handleClose">
    <div class="login-modal">
      <div class="login-header">
        <svg-icon icon-class="login-mall" class="login-logo"></svg-icon>
        <h2 class="login-title">登录商城</h2>
      </div>
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" autocomplete="on" label-position="top">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" autocomplete="on" @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password
            autocomplete="on" @keyup.enter="handleLogin">
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
        <a class="login-link" href="javascript:void(0)">忘记密码?</a>
        <span class="login-divider">·</span>
        <a class="login-link" href="javascript:void(0)">注册新账号</a>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped>
.login-modal {
  padding: 8px 8px 16px;
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-logo {
  width: 48px;
  height: 48px;
  color: #ff5000;
}

.login-title {
  margin: 12px 0 0;
  font-size: 24px;
  font-weight: 300;
  color: #1f2328;
  letter-spacing: -0.5px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #1f2328;
}

.login-button {
  width: 100%;
  margin-top: 8px;
  height: 40px;
  font-size: 15px;
  background-color: #ff5000;
  border-color: #ff5000;
}

.login-button:hover {
  background-color: #e64a00;
  border-color: #e64a00;
}

.login-footer {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #57606a;
}

.login-link {
  color: #ff5000;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}

.login-divider {
  margin: 0 6px;
}
</style>
