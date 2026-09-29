<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <el-icon><Location /></el-icon>
        <h1>停车位预约管理系统</h1>
        <p>公司园区 · 错峰预约 · 智慧停车</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        size="large"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" clearable>
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-tips">
        <p>默认账号：</p>
        <p>系统管理员 admin / 123456</p>
        <p>车位管理员 manager / 123456</p>
        <p>普通员工 employee1 / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store/user';
import { login } from '@/api/auth';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const formRef = ref();

const form = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    const res = await login(form);
    if (res.code === 200) {
      userStore.setUser(res.data.user, res.data.token);
      ElMessage.success(res.message || '登录成功');
      router.push('/dashboard');
    } else {
      ElMessage.error(res.message || '登录失败');
    }
  } catch (err) {
    ElMessage.error(err.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a2980 0%, #26d0ce 100%);
}

.login-box {
  width: 420px;
  padding: 40px;
  background: var(--color-bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-float);
  animation: card-in 0.4s ease;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .el-icon {
    font-size: 48px;
    color: var(--color-primary);
    margin-bottom: 12px;
  }

  h1 {
    font-size: 24px;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--color-text-placeholder);
  }
}

.login-btn {
  width: 100%;
}

.login-tips {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-placeholder);
  line-height: 1.8;
}
</style>
