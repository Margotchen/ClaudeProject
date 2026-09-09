<template>
  <div class="export-page">
    <h2>导出中心</h2>

    <el-card title="申领明细导出" class="export-card">
      <el-form :model="applyExportForm" label-width="100px">
        <el-form-item label="活动">
          <el-select v-model="applyExportForm.activityId" placeholder="全部活动" clearable style="width: 300px">
            <el-option v-for="act in activityOptions" :key="act.id" :label="act.activity_name" :value="act.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发货状态">
          <el-select v-model="applyExportForm.status" placeholder="全部状态" clearable style="width: 300px">
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已签收" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="格式">
          <el-radio-group v-model="applyExportForm.format">
            <el-radio-button label="xlsx">Excel</el-radio-button>
            <el-radio-button label="csv">CSV</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="exportApplyDetail(false)">导出全部筛选结果</el-button>
          <el-button type="success" :disabled="selectedApplyIds.length === 0" @click="exportApplyDetail(true)">
            导出选中记录（{{ selectedApplyIds.length }}）
          </el-button>
        </el-form-item>
      </el-form>

      <el-table
        :data="applyList"
        style="margin-top: 16px"
        max-height="400"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="申领单号" width="100" />
        <el-table-column prop="activity.activity_name" label="活动名称" />
        <el-table-column prop="user.real_name" label="员工姓名" width="120" />
        <el-table-column prop="total_count" label="申领数量" width="100" />
        <el-table-column label="发货状态" width="100">
          <template #default="{ row }">
            {{ statusText(row.apply_status) }}
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="申领时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="prev, pager, next, sizes"
        :page-sizes="[10, 20, 50]"
        style="margin-top: 16px"
        @change="loadApplyList"
      />
    </el-card>

    <el-card title="统计报表导出" class="export-card">
      <p style="margin-bottom: 16px; color: #606266">导出包含核心指标、礼品排行、部门参与率、发货进度等统计报表。</p>
      <el-button type="primary" @click="exportStats">导出统计报表</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getActivityList } from '@/api/activity'
import { getApplyList } from '@/api/apply'
import { exportApply, exportStatistics } from '@/api/export'
import { downloadFile } from '@/utils/download'

const activityOptions = ref([])
const applyList = ref([])
const selectedApplyIds = ref([])

const applyExportForm = reactive({
  activityId: '',
  status: '',
  format: 'xlsx'
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const statusText = (status) => {
  const map = { 1: '待发货', 2: '已发货', 3: '已签收', 4: '已取消' }
  return map[status] || '-'
}

onMounted(async () => {
  const res = await getActivityList({ page: 1, pageSize: 1000 })
  activityOptions.value = res.data.list || []
  loadApplyList()
})

watch(() => [applyExportForm.activityId, applyExportForm.status], () => {
  pagination.page = 1
  loadApplyList()
})

async function loadApplyList() {
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (applyExportForm.activityId) params.activityId = applyExportForm.activityId
    if (applyExportForm.status !== '') params.status = applyExportForm.status

    const res = await getApplyList(params)
    applyList.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch {
    applyList.value = []
    pagination.total = 0
  }
}

function handleSelectionChange(selection) {
  selectedApplyIds.value = selection.map(row => row.id)
}

const exportApplyDetail = async (onlySelected) => {
  try {
    const params = { format: applyExportForm.format }
    if (applyExportForm.activityId) params.activityId = applyExportForm.activityId
    if (applyExportForm.status !== '') params.status = applyExportForm.status
    if (onlySelected && selectedApplyIds.value.length > 0) {
      params.ids = selectedApplyIds.value.join(',')
    }

    const response = await exportApply(params)
    downloadFile(response, `申领明细_${Date.now()}.${applyExportForm.format}`)
    ElMessage.success('导出成功')
  } catch (err) {
    console.error('导出失败:', err)
  }
}

const exportStats = async () => {
  try {
    const response = await exportStatistics()
    downloadFile(response, `统计报表_${Date.now()}.xlsx`)
    ElMessage.success('导出成功')
  } catch (err) {
    console.error('导出失败:', err)
  }
}
</script>

<style scoped>
.export-page h2 {
  margin-bottom: 20px;
}

.export-card {
  margin-bottom: 20px;
}
</style>
