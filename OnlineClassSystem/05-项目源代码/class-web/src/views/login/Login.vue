<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <el-icon :size="36" color="#fff"><Platform /></el-icon>
        <h1>在线课堂直播平台</h1>
        <p>教 · 学 · 练 · 测 · 评 一站式教学闭环</p>
      </div>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        autocomplete="off"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" :prefix-icon="User" autocomplete="off" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="Lock"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Platform, User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../../store/user'
import { useThemeStore } from '../../store/theme'

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 进入登录页时清空表单，确保退出登录后不残留账密
onMounted(() => {
  form.username = ''
  form.password = ''
})

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    const userInfo = await userStore.fetchUserInfo()
    // 登录后以后端保存的主题偏好为准（换设备恢复）
    if (userInfo.theme && userInfo.theme !== themeStore.theme) {
      themeStore.setTheme(userInfo.theme, { syncRemote: false })
    }
    ElMessage.success(`欢迎回来，${userInfo.realName}`)
    router.push('/')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-end) 50%, var(--color-primary) 100%);
  background-size: 200% 200%;
  animation: bg-flow 12s ease infinite;

  @keyframes bg-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .login-card {
    width: 400px;
    padding: 40px;
    background: var(--color-bg-card);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-float);
    animation: card-in 0.4s ease-out;

    @keyframes card-in {
      from { opacity: 0; transform: translateY(16px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .brand {
      text-align: center;
      margin-bottom: 28px;

      h1 {
        margin-top: 10px;
        font-size: 22px;
        color: var(--color-text-primary);
      }

      p {
        margin-top: 6px;
        font-size: 13px;
        color: var(--color-text-secondary);
      }
    }

    .login-btn {
      width: 100%;
    }
  }
}
</style>
