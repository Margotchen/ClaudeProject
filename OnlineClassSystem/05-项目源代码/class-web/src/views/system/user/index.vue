<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">用户管理</div>
      <div class="page-desc">管理平台全部用户账号与角色分配</div>
    </div>

    <BaseCard>
      <div class="toolbar">
        <el-input
          v-model="query.keyword"
          placeholder="账号 / 姓名"
          clearable
          style="width: 200px"
          @keyup.enter="loadData"
        />
        <el-select v-model="query.roleId" placeholder="角色" clearable style="width: 140px">
          <el-option v-for="r in roleList" :key="r.id" :label="r.roleName" :value="r.id" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="primary" :icon="Plus" style="margin-left: auto" @click="openDialog()">
          新增用户
        </el-button>
      </div>

      <el-skeleton v-if="loading && !tableData.length" :rows="5" animated />
      <el-table v-else v-loading="loading" :data="tableData" stripe>
        <template #empty><el-empty description="暂无用户" :image-size="80" /></template>
        <el-table-column prop="username" label="账号" min-width="110" />
        <el-table-column prop="realName" label="姓名" min-width="100" />
        <el-table-column label="角色" width="110">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.roleCode)" effect="light">{{ row.roleName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.status === 1"
              :disabled="row.id === userStore.userInfo?.id"
              @change="(val) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginTime" label="最后登录" width="170">
          <template #default="{ row }">{{ row.lastLoginTime || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="openResetDialog(row)">重置密码</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.id === userStore.userInfo?.id"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @change="loadData"
      />
    </BaseCard>

    <!-- 新增 / 编辑抽屉 -->
    <el-drawer v-model="dialogVisible" :title="form.id ? '编辑用户' : '新增用户'" size="420px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roleList" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="选填" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="选填" />
        </el-form-item>
        <el-form-item v-if="!form.id" label="初始密码">
          <el-input v-model="form.password" placeholder="默认 123456" show-password type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-drawer>

    <!-- 重置密码 -->
    <el-dialog v-model="resetVisible" title="重置密码" width="380px">
      <el-form ref="resetFormRef" :model="resetForm" :rules="resetRules" label-width="80px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetForm.password" show-password type="password" placeholder="6-32 位" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleResetPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pageUsers, createUser, updateUser, deleteUser, updateUserStatus, resetUserPassword } from '../../../api/user'
import { listRoles } from '../../../api/role'
import { useUserStore } from '../../../store/user'

const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const roleList = ref([])

const query = reactive({ pageNum: 1, pageSize: 10, keyword: '', roleId: null })

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, username: '', realName: '', roleId: null, email: '', phone: '', password: '' })
const formRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const resetVisible = ref(false)
const resetFormRef = ref()
const resetForm = reactive({ id: null, password: '' })
const resetRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度需在 6-32 位之间', trigger: 'blur' }
  ]
}

function roleTagType(roleCode) {
  return { ADMIN: 'danger', TEACHER: 'primary', HEAD_TEACHER: 'warning', STUDENT: 'success' }[roleCode] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const data = await pageUsers(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.keyword = ''
  query.roleId = null
  query.pageNum = 1
  loadData()
}

function openDialog(row) {
  Object.assign(form, row
    ? { id: row.id, username: row.username, realName: row.realName, roleId: row.roleId, email: row.email, phone: row.phone, password: '' }
    : { id: null, username: '', realName: '', roleId: null, email: '', phone: '', password: '' })
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateUser(form.id, form)
    } else {
      await createUser(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleStatusChange(row, val) {
  try {
    await updateUserStatus(row.id, val ? 1 : 0)
    row.status = val ? 1 : 0
    ElMessage.success(val ? '已启用' : '已禁用')
  } catch (e) {
    // 失败时保持原状态（request 已提示）
  }
}

function openResetDialog(row) {
  resetForm.id = row.id
  resetForm.password = ''
  resetVisible.value = true
}

async function handleResetPassword() {
  await resetFormRef.value.validate()
  saving.value = true
  try {
    await resetUserPassword(resetForm.id, resetForm.password)
    ElMessage.success('密码已重置')
    resetVisible.value = false
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除用户「${row.realName}」吗？`, '警告', { type: 'warning' })
  await deleteUser(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(async () => {
  loadData()
  roleList.value = await listRoles()
})
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
