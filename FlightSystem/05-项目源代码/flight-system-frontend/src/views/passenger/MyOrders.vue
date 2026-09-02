<template>
  <div class="my-orders">
    <h1>My Orders</h1>

    <el-card v-loading="loading">
      <el-table :data="orderList" border>
        <el-table-column prop="order_no" label="Order No" width="180" />
        <el-table-column label="Flight">
          <template #default="{ row }">
            {{ row.schedule?.flight?.flight_no }}
            <br />
            <span class="route-text">
              {{ row.schedule?.flight?.departureAirport?.airport_code }} → {{ row.schedule?.flight?.arrivalAirport?.airport_code }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Departure" width="160">
          <template #default="{ row }">
            {{ formatDate(row.schedule?.departure_time) }}
            <br />
            {{ formatTime(row.schedule?.departure_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="cabin_class" label="Cabin">
          <template #default="{ row }">
            {{ capitalize(row.cabin_class) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="Amount" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount }}
          </template>
        </el-table-column>
        <el-table-column label="Status" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">Detail</el-button>
            <el-button v-if="row.status === 0" size="small" type="primary" @click="payOrder(row)">Pay</el-button>
            <el-button v-if="row.status === 0" size="small" type="danger" @click="cancelOrder(row)">Cancel</el-button>
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

const router = useRouter()
const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10 })

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const statusType = (status) => {
  return ['warning', 'success', 'success', 'primary', 'info', 'info', 'danger'][status] || 'info'
}

const statusText = (status) => {
  return ['Pending', 'Paid', 'Ticketed', 'Checked-in', 'Changed', 'Refunded', 'Cancelled'][status] || 'Unknown'
}

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
    await ElMessageBox.confirm('Cancel this order?', 'Confirm', { type: 'warning' })
    await cancelOrderApi(row.id)
    ElMessage.success('Order cancelled')
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
