<template>
  <div class="activity-manage-page">
    <div class="page-header">
      <h2>活动管理</h2>
      <el-button type="primary" @click="openDialog()">新增活动</el-button>
    </div>

    <el-table :data="activities" border v-loading="loading">
      <el-table-column prop="activity_name" label="活动名称" />
      <el-table-column prop="activity_type" label="活动类型" width="100" />
      <el-table-column prop="start_time" label="开始时间" width="180">
        <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
      </el-table-column>
      <el-table-column prop="end_time" label="结束时间" width="180">
        <template #default="{ row }">{{ formatTime(row.end_time) }}</template>
      </el-table-column>
      <el-table-column prop="limit_count" label="限选数量" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="ACTIVITY_STATUS[row.status]?.type">{{ ACTIVITY_STATUS[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="primary" @click="openGiftDialog(row)">配置礼品</el-button>
          <el-button v-if="row.status === 1" size="small" type="warning" @click="changeStatus(row.id, 3)">停用</el-button>
          <el-button v-else-if="row.status === 3" size="small" type="success" @click="changeStatus(row.id, 1)">启用</el-button>
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

    <!-- 活动表单弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑活动' : '新增活动'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="活动名称" prop="activity_name">
          <el-input v-model="form.activity_name" />
        </el-form-item>
        <el-form-item label="活动类型" prop="activity_type">
          <el-select v-model="form.activity_type" style="width: 100%">
            <el-option v-for="type in ACTIVITY_TYPES" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker v-model="form.start_time" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker v-model="form.end_time" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每人限选" prop="limit_count">
          <el-input-number v-model="form.limit_count" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="活动说明">
          <el-input v-model="form.description" type="textarea" rows="4" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 配置礼品弹窗 -->
    <el-dialog v-model="giftDialogVisible" title="配置活动礼品" width="600px">
      <el-transfer
        v-model="selectedGiftIds"
        :data="giftOptions"
        :titles="['可选礼品', '已选礼品']"
        filterable
      />

      <template #footer>
        <el-button @click="giftDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSetGifts">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getActivityList, createActivity, updateActivity, deleteActivity, updateActivityStatus, getActivityGifts, setActivityGifts } from '@/api/activity'
import { getGiftList } from '@/api/gift'
import { ACTIVITY_STATUS, ACTIVITY_TYPES } from '@/utils/constants'

const loading = ref(false)
const activities = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

const dialogVisible = ref(false)
const giftDialogVisible = ref(false)
const formRef = ref()
const currentActivityId = ref(null)
const giftOptions = ref([])
const selectedGiftIds = ref([])

const form = reactive({
  id: null,
  activity_name: '',
  activity_type: '',
  start_time: '',
  end_time: '',
  limit_count: 1,
  description: ''
})

const rules = {
  activity_name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  activity_type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  limit_count: [{ required: true, message: '请输入限选数量', trigger: 'blur' }]
}

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getActivityList(query)
    activities.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  if (row) {
    Object.assign(form, {
      ...row,
      start_time: row.start_time ? new Date(row.start_time) : '',
      end_time: row.end_time ? new Date(row.end_time) : ''
    })
  } else {
    Object.assign(form, {
      id: null,
      activity_name: '',
      activity_type: '',
      start_time: '',
      end_time: '',
      limit_count: 1,
      description: ''
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  const payload = {
    ...form,
    start_time: form.start_time,
    end_time: form.end_time
  }
  if (form.id) {
    await updateActivity(form.id, payload)
    ElMessage.success('更新成功')
  } else {
    await createActivity(payload)
    ElMessage.success('新增成功')
  }
  dialogVisible.value = false
  await loadData()
}

const changeStatus = async (id, status) => {
  await updateActivityStatus(id, { status })
  ElMessage.success('操作成功')
  await loadData()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该活动吗？', '提示', { type: 'warning' })
    await deleteActivity(row.id)
    ElMessage.success('删除成功')
    await loadData()
  } catch {
    // 取消
  }
}

const openGiftDialog = async (row) => {
  currentActivityId.value = row.id
  const [giftRes, selectedRes] = await Promise.all([
    getGiftList({ page: 1, pageSize: 1000 }),
    getActivityGifts(row.id)
  ])
  giftOptions.value = (giftRes.data.list || []).map(g => ({
    key: g.id,
    label: `${g.gift_name}（库存${g.stock}）`,
    disabled: g.status !== 1
  }))
  selectedGiftIds.value = (selectedRes.data || []).map(g => g.id)
  giftDialogVisible.value = true
}

const handleSetGifts = async () => {
  await setActivityGifts(currentActivityId.value, { giftIds: selectedGiftIds.value })
  ElMessage.success('配置成功')
  giftDialogVisible.value = false
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
