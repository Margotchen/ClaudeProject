<template>
  <div class="refund-change-handle">
    <h1>{{ $t('refundChangeHandle.title') }}</h1>

    <el-card v-loading="loading">
      <el-table :data="applicationList" border>
        <el-table-column prop="id" :label="$t('refundChangeHandle.id')" width="80" />
        <el-table-column :label="$t('refundChangeHandle.type')" width="120">
          <template #default="{ row }">
            {{ row.type === 1 ? $t('refundChangeHandle.refund') : $t('refundChangeHandle.change') }}
          </template>
        </el-table-column>
        <el-table-column prop="order.order_no" :label="$t('refundChangeHandle.orderNo')" width="160" />
        <el-table-column :label="$t('refundChangeHandle.flight')">
          <template #default="{ row }">
            {{ row.order?.schedule?.flight?.flight_no }}
            {{ row.order?.schedule?.flight?.departureAirport?.airport_code }} → {{ row.order?.schedule?.flight?.arrivalAirport?.airport_code }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" :label="$t('refundChangeHandle.reason')" />
        <el-table-column prop="fee" :label="$t('refundChangeHandle.fee')" width="120">
          <template #default="{ row }">
            ¥{{ row.fee }}
          </template>
        </el-table-column>
        <el-table-column prop="refund_amount" :label="$t('refundChangeHandle.refundDiff')" width="140">
          <template #default="{ row }">
            ¥{{ row.refund_amount }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="200">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="process(row, 1)">{{ $t('refundChangeHandle.approve') }}</el-button>
            <el-button size="small" type="danger" @click="process(row, 2)">{{ $t('refundChangeHandle.reject') }}</el-button>
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
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

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
    ElMessage.success(status === 1 ? t('refundChangeHandle.approved') : t('refundChangeHandle.rejected'))
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
