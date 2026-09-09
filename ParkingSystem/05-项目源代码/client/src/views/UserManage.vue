<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openDialog()"><Plus /> 新增用户</el-button>
    </div>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="角色">
        <el-select v-model="query.role" placeholder="全部角色" clearable @change="loadData">
          <el-option label="员工" value="employee" />
          <el-option label="车位管理员" value="parking_admin" />
          <el-option label="系统管理员" value="system_admin" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="query.keyword" placeholder="用户名/姓名/工号" clearable @keyup.enter="loadData" />
      </el-form-item>
      <el-form-item>
        <el-button @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="users" border v-loading="loading">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="real_name" label="姓名" />
      <el-table-column prop="employee_no" label="工号" />
      <el-table-column prop="department_name" label="部门" />
      <el-table-column prop="role" label="角色">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)">{{ roleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="violation_count" label="违约次数" />
      <el-table-column prop="ban_until" label="封禁截止" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">{{ row.status === 'active' ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="openResetDialog(row)">重置密码</el-button>
          <el-button v-if="row.ban_until" size="small" type="success" @click="handleUnban(row)">解封</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      class="pagination"
    />

    <!-- 新增/编辑用户 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="form.employeeNo" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="form.departmentId" placeholder="请选择部门" clearable>
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="员工" value="employee" />
            <el-option label="车位管理员" value="parking_admin" />
            <el-option label="系统管理员" value="system_admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码 -->
    <el-dialog v-model="resetDialogVisible" title="重置密码" width="400px">
      <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef" label-width="100px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetForm.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetSubmit" :loading="resetting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getUsers, createUser, updateUser, resetPassword, unbanUser, getDepartments } from '@/api/user';

const loading = ref(false);
const users = ref([]);
const departments = ref([]);
const total = ref(0);
const dialogVisible = ref(false);
const resetDialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const resetting = ref(false);
const formRef = ref();
const resetFormRef = ref();
const currentId = ref(null);
const resetUserId = ref(null);

const query = reactive({
  role: '',
  keyword: '',
  page: 1,
  pageSize: 20
});

const form = reactive({
  username: '',
  password: '',
  realName: '',
  employeeNo: '',
  departmentId: '',
  phone: '',
  role: 'employee',
  status: 'active'
});

const resetForm = reactive({
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
};

const resetRules = {
  password: [{ required: true, message: '请输入新密码', trigger: 'blur' }]
};

const roleText = (role) => ({
  employee: '员工',
  parking_admin: '车位管理员',
  system_admin: '系统管理员'
}[role] || role);

const roleTagType = (role) => ({
  employee: '',
  parking_admin: 'warning',
  system_admin: 'danger'
}[role] || '');

async function loadDepartments() {
  const res = await getDepartments();
  departments.value = res.data || [];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getUsers(query);
    users.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openDialog(row = null) {
  isEdit.value = !!row;
  currentId.value = row?.id || null;
  form.username = row?.username || '';
  form.password = '';
  form.realName = row?.real_name || '';
  form.employeeNo = row?.employee_no || '';
  form.departmentId = row?.department_id || '';
  form.phone = row?.phone || '';
  form.role = row?.role || 'employee';
  form.status = row?.status || 'active';
  dialogVisible.value = true;
}

function openResetDialog(row) {
  resetUserId.value = row.id;
  resetForm.password = '';
  resetDialogVisible.value = true;
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const payload = {
      username: form.username,
      password: form.password,
      realName: form.realName,
      employeeNo: form.employeeNo,
      departmentId: form.departmentId,
      phone: form.phone,
      role: form.role,
      status: form.status
    };
    if (isEdit.value) {
      const { username, password, ...updatePayload } = payload;
      await updateUser(currentId.value, updatePayload);
    } else {
      await createUser(payload);
    }
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

async function handleResetSubmit() {
  const valid = await resetFormRef.value.validate().catch(() => false);
  if (!valid) return;

  resetting.value = true;
  try {
    await resetPassword(resetUserId.value, { password: resetForm.password });
    ElMessage.success('密码重置成功');
    resetDialogVisible.value = false;
  } catch (err) {
    ElMessage.error(err.message || '重置失败');
  } finally {
    resetting.value = false;
  }
}

async function handleUnban(row) {
  try {
    await unbanUser(row.id);
    ElMessage.success('已解除封禁');
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || '解封失败');
  }
}

onMounted(async () => {
  await loadDepartments();
  await loadData();
});
</script>

<style scoped lang="scss">
.page-container {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
