<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Iphone, Message } from '@element-plus/icons-vue'
import { registerBuyerAPI, getAuthCodeAPI } from '@/apis/buyer'
import { useBuyerStore } from '@/stores/buyer'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BuyerRegister'
})

const router = useRouter()
const buyerStore = useBuyerStore()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const codeLoading = ref(false)
const countdown = ref(0)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  authCode: '',
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = reactive<FormRules<typeof registerForm>>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' },
  ],
  authCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位', trigger: 'blur' },
  ],
})

const startCountdown = () => {
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const getAuthCode = async () => {
  if (!registerForm.phone) {
    ElMessage.warning('请先输入手机号')
    return
  }
  codeLoading.value = true
  try {
    await getAuthCodeAPI(registerForm.phone)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (err) {
    console.error('获取验证码失败:', err)
  } finally {
    codeLoading.value = false
  }
}

const handleRegister = () => {
  registerFormRef.value?.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await registerBuyerAPI({
        username: registerForm.username,
        password: registerForm.password,
        telephone: registerForm.phone,
        authCode: registerForm.authCode,
      })
      ElMessage.success('注册成功，正在登录')
      await buyerStore.buyerLogin({
        username: registerForm.username,
        password: registerForm.password,
      })
      router.replace('/buyer/index')
    } catch (err) {
      console.error('注册失败:', err)
    } finally {
      loading.value = false
    }
  })
}

const goLogin = () => {
  router.replace('/buyer/login')
}
</script>

<template>
  <div class="buyer-register-page">
    <div class="register-header">
      <svg-icon icon-class="login-mall" class="register-logo"></svg-icon>
      <h2 class="register-title">买家注册</h2>
      <p class="register-subtitle">创建账号，开启购物之旅</p>
    </div>

    <div class="register-form-wrapper">
      <el-form ref="registerFormRef" :model="registerForm" :rules="rules" label-position="top">
        <el-form-item prop="username" label="用户名">
          <el-input v-model="registerForm.username" placeholder="请输入用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword" label="确认密码">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="phone" label="手机号">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号" maxlength="11">
            <template #prefix>
              <el-icon><Iphone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="authCode" label="验证码">
          <el-input v-model="registerForm.authCode" placeholder="请输入验证码" maxlength="6">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
            <template #append>
              <el-button :disabled="countdown > 0" :loading="codeLoading" @click="getAuthCode">
                {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-button type="primary" class="register-button" :loading="loading" @click="handleRegister">
          注册
        </el-button>
      </el-form>

      <div class="register-footer">
        <span class="login-tip">已有账号？</span>
        <el-button type="primary" link @click="goLogin">去登录</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buyer-register-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #fff5f0 0%, #ffffff 100%);
  padding: 20px;
}

.register-header {
  text-align: center;
  padding: 40px 0 30px;
}

.register-logo {
  width: 64px;
  height: 64px;
  color: #ff5000;
}

.register-title {
  margin: 16px 0 8px;
  font-size: 24px;
  color: #333;
}

.register-subtitle {
  margin: 0;
  font-size: 14px;
  color: #999;
}

.register-form-wrapper {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.register-button {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  font-size: 16px;
  background-color: #ff5000;
  border-color: #ff5000;
}

.register-button:hover {
  background-color: #e64a00;
  border-color: #e64a00;
}

.register-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: #666;
}

.login-tip {
  margin-right: 4px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
}

@media (min-width: 768px) {
  .buyer-register-page {
    max-width: 450px;
    margin: 0 auto;
  }
}
</style>
