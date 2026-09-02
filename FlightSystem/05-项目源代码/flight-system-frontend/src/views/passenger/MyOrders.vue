<template>
  <div class="my-orders">
    <h1>{{ $t('myOrders.title') }}</h1>

    <el-card v-loading="loading">
      <el-table :data="orderList" border>
        <el-table-column prop="order_no" :label="$t('myOrders.orderNo')" width="180" />
        <el-table-column :label="$t('myOrders.flight')">
          <template #default="{ row }">
            {{ row.schedule?.flight?.flight_no }}
            <br />
            <span class="route-text">
              {{ row.schedule?.flight?.departureAirport?.airport_code }} → {{ row.schedule?.flight?.arrivalAirport?.airport_code }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('myOrders.departure')" width="160">
          <template #default="{ row }">
            {{ formatDate(row.schedule?.departure_time) }}
            <br />
            {{ formatTime(row.schedule?.departure_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="cabin_class" :label="$t('myOrders.cabin')">
          <template #default="{ row }">
            {{ cabinClassText(row.cabin_class) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" :label="$t('myOrders.amount')" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="orderStatusType(row.status)">{{ orderStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('myOrders.actions')" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">{{ $t('common.detail') }}</el-button>
            <el-button v-if="row.status === 0" size="small" type="primary" @click="payOrder(row)">{{ $t('common.pay') }}</el-button>
            <el-button v-if="row.status === 0" size="small" type="danger" @click="cancelOrder(row)">{{ $t('common.cancel') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOrders"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyOrders, cancelOrder as cancelOrderApi } from '@/api/booking'
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const router = useRouter()
const { t } = useI18n()
const { formatDate, formatTime, cabinClassText, orderStatusType, orderStatusText } = useI18nHelpers()

const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await getMyOrders(query)
    orderList.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const viewOrder = (row) => {
  router.push(`/passenger/order/${row.id}`)
}

const payOrder = (row) => {
  router.push(`/passenger/pay/${row.id}`)
}

const cancelOrder = async (row) => {
  try {
    await ElMessageBox.confirm(t('myOrders.cancelConfirm'), t('common.confirm'), { type: 'warning' })
    await cancelOrderApi(row.id)
    ElMessage.success(t('myOrders.cancelled'))
    loadOrders()
  } catch (err) {
    // cancelled
  }
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.my-orders {
  padding: 20px;
}

.route-text {
  color: #909399;
  font-size: 12px;
}
</style>
