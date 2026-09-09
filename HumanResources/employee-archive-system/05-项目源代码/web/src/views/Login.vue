<template>
  <div class="login-page">
    <el-card class="login-card" shadow="always">
      <div class="login-title">员工档案管理系统</div>
      <div class="login-subtitle">请登录</div>

      <el-alert
        v-if="errorMsg"
        :title="errorMsg"
        type="error"
        :closable="false"
        show-icon
        class="error-alert"
      />

      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" clearable size="large">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password size="large">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" size="large" @click.prevent="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>

      <div class="login-tip">默认账号：admin / admin123</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const errorMsg = ref('');

const form = reactive({
  username: 'admin',
  password: 'admin123'
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

async function handleLogin() {
  errorMsg.value = '';

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
  } catch (e) {
    return;
  }

  loading.value = true;
  try {
    const res = await axios.post('/api/auth/login', {
      username: form.username,
      password: form.password
    });

    if (res.data?.code === 0) {
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      ElMessage.success('登录成功');
      // 确保导航守卫能读取到 token 后再跳转
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } else {
      errorMsg.value = res.data?.message || '登录失败';
    }
  } catch (error) {
    console.error('登录失败:', error);
    errorMsg.value = error.response?.data?.message || error.message || '登录失败，请检查网络或账号密码';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #304156 0%, #409eff 100%);
  box-sizing: border-box;
}
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 12px;
  box-sizing: border-box;
}
.login-title {
  text-align: center;
  font-size: 26px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}
.login-subtitle {
  text-align: center;
  font-size: 14px;
  color: #909399;
  margin-bottom: 28px;
}
.error-alert {
  margin-bottom: 20px;
}
.login-btn {
  width: 100%;
  margin-top: 8px;
}
.login-tip {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 16px;
}
:deep(.el-input__prefix-inner) {
  display: flex;
  align-items: center;
}
</style>
