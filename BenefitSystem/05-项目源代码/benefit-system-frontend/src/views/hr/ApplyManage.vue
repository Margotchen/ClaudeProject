<template>
  <div class="apply-manage-page">
    <h2>申领管理</h2>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="活动">
        <el-select v-model="query.activityId" placeholder="全部活动" clearable style="width: 200px">
          <el-option v-for="act in activityOptions" :key="act.id" :label="act.activity_name" :value="act.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 150px">
          <el-option label="待发货" :value="1" />
          <el-option label="已发货" :value="2" />
          <el-option label="已签收" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="工号/姓名" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-skeleton v-if="!listLoaded" :rows="5" animated />
    <el-table v-show="listLoaded" :data="applies" border v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="activity.activity_name" label="活动名称" />
      <el-table-column prop="user.user_no" label="工号" />
      <el-table-column prop="user.real_name" label="姓名" />
      <el-table-column prop="user.department" label="部门" />
      <el-table-column label="申领礼品">
        <template #default="{ row }">
          <el-tag v-for="item in row.items" :key="item.id" style="margin-right: 4px">{{ item.gift_name_snapshot }} x{{ item.quantity }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="total_count" label="总数量" width="80" />
      <el-table-column prop="receiver_snapshot" label="收货人" width="100" />
      <el-table-column prop="phone_snapshot" label="联系电话" width="130" />
      <el-table-column prop="address_snapshot" label="完整收货地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="apply_status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="APPLY_STATUS[row.apply_status]?.type">{{ APPLY_STATUS[row.apply_status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.apply_status === 1" size="small" type="primary" @click="openDeliverDialog(row)">发货</el-button>
          <el-button v-if="row.apply_status === 2" size="small" @click="openDeliverDialog(row)">修改物流</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无申领记录" :image-size="80" />
      </template>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      style="margin-top: 16px"
    />

    <div class="batch-actions">
      <el-button type="primary" :disabled="!selectedIds.length" @click="openBatchDeliverDialog">批量发货</el-button>
    </div>

    <el-dialog v-model="deliverDialogVisible" :title="isBatch ? '批量发货' : '发货'" width="500px">
      <el-form label-width="100px">
        <el-form-item label="物流公司">
          <el-input v-model="deliverForm.expressCompany" />
        </el-form-item>
        <el-form-item label="快递单号">
          <el-input v-model="deliverForm.expressNo" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="deliverDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDeliver">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getApplyList } from '@/api/apply'
import { getActivityList } from '@/api/activity'
import { deliverApply, batchDeliver } from '@/api/deliver'
import { APPLY_STATUS } from '@/utils/constants'

const loading = ref(false)
const listLoaded = ref(false)
const applies = ref([])
const total = ref(0)
const activityOptions = ref([])
const selectedIds = ref([])

const query = reactive({
  page: 1,
  pageSize: 10,
  activityId: '',
  status: '',
  keyword: ''
})

const deliverDialogVisible = ref(false)
const isBatch = ref(false)
const currentApplyId = ref(null)
const deliverForm = reactive({
  expressCompany: '',
  expressNo: ''
})

onMounted(async () => {
  await loadActivities()
  await loadData()
})

const loadActivities = async () => {
  const res = await getActivityList({ page: 1, pageSize: 1000 })
  activityOptions.value = res.data.list || []
}

const loadData = async () => {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.activityId) delete params.activityId
    if (params.status === '') delete params.status
    const res = await getApplyList(params)
    applies.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
    listLoaded.value = true
  }
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

const openDeliverDialog = (row) => {
  isBatch.value = false
  currentApplyId.value = row.id
  deliverForm.expressCompany = row.express_company || ''
  deliverForm.expressNo = row.express_no || ''
  deliverDialogVisible.value = true
}

const openBatchDeliverDialog = () => {
  isBatch.value = true
  currentApplyId.value = null
  deliverForm.expressCompany = ''
  deliverForm.expressNo = ''
  deliverDialogVisible.value = true
}

const handleDeliver = async () => {
  if (isBatch.value) {
    await batchDeliver({ ids: selectedIds.value, ...deliverForm })
    ElMessage.success('批量发货成功')
  } else {
    await deliverApply(currentApplyId.value, deliverForm)
    ElMessage.success('发货成功')
  }
  deliverDialogVisible.value = false
  await loadData()
}
</script>

<style scoped>
.search-form {
  margin-bottom: 20px;
}

.batch-actions {
  margin-top: 16px;
}
</style>
