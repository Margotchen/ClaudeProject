<template>
  <div class="payment-page">
    <h1>Payment</h1>

    <el-card v-loading="loading" class="order-card">
      <template #header>
        <div class="card-header">
          <span>Order {{ order?.order_no }}</span>
          <el-tag :type="statusType(order?.status)">{{ statusText(order?.status) }}</el-tag>
        </div>
      </template>

      <div v-if="order" class="order-info">
        <div class="info-row">
          <span class="label">Flight:</span>
          <span>{{ order.schedule?.flight?.flight_no }}</span>
        </div>
        <div class="info-row">
          <span class="label">Route:</span>
          <span>{{ order.schedule?.flight?.departureAirport?.city_name }} ({{ order.schedule?.flight?.departureAirport?.airport_code }}) → {{ order.schedule?.flight?.arrivalAirport?.city_name }} ({{ order.schedule?.flight?.arrivalAirport?.airport_code }})</span>
        </div>
        <div class="info-row">
          <span class="label">Departure:</span>
          <span>{{ formatDate(order.schedule?.departure_time) }} {{ formatTime(order.schedule?.departure_time) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Cabin:</span>
          <span>{{ capitalize(order.cabin_class) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Passengers:</span>
          <span>{{ order.passengers?.length }}</span>
        </div>
        <div class="info-row">
          <span class="label">Total:</span>
          <span class="amount">¥{{ order.total_amount }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="pay-card">
      <template #header>
        <span>Payment Method</span>
      </template>
      <el-radio-group v-model="payForm.method">
        <el-radio label="simulate">Simulated Payment</el-radio>
      </el-radio-group>
      <div class="pay-actions">
        <el-button type="primary" size="large" :loading="paying" @click="handlePay">Pay Now</el-button>
        <el-button size="large" @click="goBack">Cancel</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '@/api/booking'
import { simulatePayment } from '@/api/payment'

const route = useRoute()
const router = useRouter()
const orderId = route.params.orderId

const loading = ref(false)
const paying = ref(false)
const order = ref(null)

const payForm = reactive({
  method: 'simulate'
})

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

const loadOrder = async () => {
  loading.value = true
  try {
    const res = await getOrderDetail(orderId)
    order.value = res.data
    if (order.value.status !== 0) {
      ElMessage.info('This order is not pending payment')
    }
  } finally {
    loading.value = false
  }
}

const handlePay = async () => {
  paying.value = true
  try {
    const res = await simulatePayment({
      orderId: parseInt(orderId),
      payMethod: payForm.method,
      simulateSuccess: true
    })
    ElMessage.success(res.message || 'Payment successful')
    router.push(`/passenger/order/${orderId}`)
  } finally {
    paying.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.payment-page {
  padding: 20px;
}

.order-card,
.pay-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  padding: 10px 0;
}

.info-row {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}

.label {
  width: 120px;
  color: #909399;
}

.amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.pay-actions {
  margin-top: 30px;
}
</style>
