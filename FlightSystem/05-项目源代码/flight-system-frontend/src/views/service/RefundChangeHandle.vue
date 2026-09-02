<template>
  <div class="refund-change-handle">
    <h1>Refund / Change Applications</h1>

    <el-card v-loading="loading">
      <el-table :data="applicationList" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="Type" width="120">
          <template #default="{ row }">
            {{ row.type === 1 ? 'Refund' : 'Change' }}
          </template>
        </el-table-column>
        <el-table-column prop="order.order_no" label="Order No" width="160" />
        <el-table-column label="Flight">
          <template #default="{ row }">
            {{ row.order?.schedule?.flight?.flight_no }}
            {{ row.order?.schedule?.flight?.departureAirport?.airport_code }} → {{ row.order?.schedule?.flight?.arrivalAirport?.airport_code }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="Reason" />
        <el-table-column prop="fee" label="Fee" width="120">
          <template #default="{ row }">
            ¥{{ row.fee }}
          </template>
        </el-table-column>
        <el-table-column prop="refund_amount" label="Refund/Diff" width="140">
          <template #default="{ row }">
            ¥{{ row.refund_amount }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="200">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="process(row, 1)">Approve</el-button>
            <el-button size="small" type="danger" @click="process(row, 2)">Reject</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadApplications"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPendingApplications, processApplication } from '@/api/refundChange'

const loading = ref(false)
const applicationList = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

const loadApplications = async () => {
  loading.value = true
  try {
    const res = await getPendingApplications(query)
    applicationList.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const process = async (row, status) => {
  try {
    await processApplication(row.id, { status, remark: '' })
    ElMessage.success(status === 1 ? 'Approved' : 'Rejected')
    loadApplications()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  loadApplications()
})
</script>

<style scoped>
.refund-change-handle {
  padding: 20px;
}
</style>
