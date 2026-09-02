<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <template #header>
        <h2 class="login-title">Flight Booking System</h2>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Enter username" />
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input v-model="form.password" type="password" placeholder="Enter password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">
            Login
          </el-button>
        </el-form-item>
      </el-form>
      <div class="demo-accounts">
        <p>Demo accounts:</p>
        <el-tag size="small">passenger / pass123</el-tag>
        <el-tag size="small">service / svc123</el-tag>
        <el-tag size="small">operator / op123</el-tag>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter password', trigger: 'blur' }]
}

const formRef = ref()
const loading = ref(false)

const handleLogin = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    await userStore.login(form)
    ElMessage.success('Login successful')
    const redirect = route.query.redirect || '/passenger/search'
    router.push(redirect)
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  border-radius: 12px;
}

.login-title {
  text-align: center;
  margin: 0;
  color: #303133;
}

.demo-accounts {
  margin-top: 16px;
  text-align: center;
}

.demo-accounts p {
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
}

.demo-accounts .el-tag {
  margin: 0 4px;
}
</style>
