<template>
  <div class="role-manage-page">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="openDialog()">新增角色</el-button>
    </div>

    <el-table :data="roles" border v-loading="loading">
      <el-table-column prop="role_code" label="角色标识" />
      <el-table-column prop="role_name" label="角色名称" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="create_time" label="创建时间">
        <template #default="{ row }">{{ formatTime(row.create_time) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑角色' : '新增角色'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="角色标识" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" rows="3" />
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
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/role'

const loading = ref(false)
const roles = ref([])
const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  roleCode: '',
  roleName: '',
  description: ''
})

const rules = {
  roleCode: [{ required: true, message: '请输入角色标识', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getRoleList()
    roles.value = res.data || []
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, {
      id: row.id,
      roleCode: row.role_code,
      roleName: row.role_name,
      description: row.description
    })
  } else {
    Object.assign(form, {
      id: null,
      roleCode: '',
      roleName: '',
      description: ''
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  if (form.id) {
    await updateRole(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await createRole(form)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  await loadData()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该角色吗？', '提示', { type: 'warning' })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // 取消
  }
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
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
