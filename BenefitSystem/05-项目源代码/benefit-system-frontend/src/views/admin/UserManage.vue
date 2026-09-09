<template>
  <div class="user-manage-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openDialog()">新增用户</el-button>
    </div>

    <el-table :data="users" border v-loading="loading">
      <el-table-column prop="user_no" label="工号" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="real_name" label="真实姓名" />
      <el-table-column prop="department" label="部门" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="role.role_name" label="角色" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="resetPwd(row)">重置密码</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      style="margin-top: 16px"
    />

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑用户' : '新增用户'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="工号" prop="userNo">
          <el-input v-model="form.userNo" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="密码" prop="password">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="form.department" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" style="width: 100%">
            <el-option v-for="role in roles" :key="role.id" :label="role.role_name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.id" label="状态">
          <el-radio-group v-model="form.status">
            <el-radio-button :label="1">启用</el-radio-button>
            <el-radio-button :label="0">禁用</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, resetPassword } from '@/api/user'
import { getRoleList } from '@/api/role'

const loading = ref(false)
const users = ref([])
const total = ref(0)
const roles = ref([])
const query = reactive({ page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  userNo: '',
  username: '',
  password: '123456',
  realName: '',
  department: '',
  phone: '',
  roleId: '',
  status: 1
})

const rules = {
  userNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

onMounted(async () => {
  await loadRoles()
  await loadData()
})

const loadRoles = async () => {
  const res = await getRoleList()
  roles.value = res.data || []
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await getUserList(query)
    users.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id,
      userNo: row.user_no,
      username: row.username,
      password: '123456',
      realName: row.real_name,
      department: row.department,
      phone: row.phone,
      roleId: row.role_id,
      status: row.status
    })
  } else {
    Object.assign(form, {
      id: null,
      userNo: '',
      username: '',
      password: '123456',
      realName: '',
      department: '',
      phone: '',
      roleId: '',
      status: 1
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (form.id) {
    await updateUser(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await createUser(form)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  await loadData()
}

const resetPwd = async (row) => {
  try {
    await ElMessageBox.confirm('确定重置该用户密码为 123456 吗？', '提示', { type: 'warning' })
    await resetPassword(row.id)
    ElMessage.success('密码重置成功')
  } catch {
    // 取消
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '提示', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // 取消
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
