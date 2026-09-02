<template>
  <div class="order-detail">
    <h1>Order Detail</h1>

    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>Order {{ order?.order_no }}</span>
          <el-tag :type="statusType(order?.status)">{{ statusText(order?.status) }}</el-tag>
        </div>
      </template>

      <div v-if="order" class="sections">
        <div class="section">
          <h3>Flight Information</h3>
          <div class="info-row">
            <span class="label">Flight No:</span>
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
            <span class="label">Arrival:</span>
            <span>{{ formatDate(order.schedule?.arrival_time) }} {{ formatTime(order.schedule?.arrival_time) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Aircraft:</span>
            <span>{{ order.schedule?.aircraft?.model }}</span>
          </div>
          <div class="info-row">
            <span class="label">Cabin Class:</span>
            <span>{{ capitalize(order.cabin_class) }}</span>
          </div>
        </div>

        <div class="section">
          <h3>Passengers</h3>
          <el-table :data="order.passengers" border>
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="id_card" label="ID Card" />
            <el-table-column prop="ticket_no" label="Ticket No" />
            <el-table-column prop="ticket.seat_no" label="Seat" />
          </el-table>
        </div>

        <div class="section">
          <h3>Contact & Payment</h3>
          <div class="info-row">
            <span class="label">Contact Name:</span>
            <span>{{ order.contact_name }}</span>
          </div>
          <div class="info-row">
            <span class="label">Contact Phone:</span>
            <span>{{ order.contact_phone }}</span>
          </div>
          <div class="info-row">
            <span class="label">Total Amount:</span>
            <span class="amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="info-row">
            <span class="label">Pay Time:</span>
            <span>{{ order.pay_time ? formatDate(order.pay_time) + ' ' + formatTime(order.pay_time) : '-' }}</span>
          </div>
        </div>

        <div class="section actions">
          <el-button v-if="order.status === 0" type="primary" @click="goPay">Pay Now</el-button>
          <el-button v-if="order.status === 0" type="danger" @click="cancelOrder">Cancel Order</el-button>
          <el-button v-if="order.status >= 2" type="primary" @click="goCheckIn">Check-in / Select Seat</el-button>
          <el-button v-if="order.status >= 2" @click="goItinerary">Itinerary</el-button>
          <el-button v-if="order.status >= 1" @click="goRefundChange">Refund / Change</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, cancelOrder as cancelOrderApi } from '@/api/booking'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id

const loading = ref(false)
const order = ref(null)

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
  } finally {
    loading.value = false
  }
}

const goPay = () => {
  router.push(`/passenger/pay/${orderId}`)
}

const cancelOrder = async () => {
  try {
    await ElMessageBox.confirm('Cancel this order?', 'Confirm', { type: 'warning' })
    await cancelOrderApi(orderId)
    ElMessage.success('Order cancelled')
    loadOrder()
  } catch (err) {
    // cancelled
  }
}

const goCheckIn = () => {
  router.push(`/passenger/checkin/${orderId}`)
}

const goItinerary = () => {
  router.push(`/passenger/itinerary/${orderId}`)
}

const goRefundChange = () => {
  router.push(`/passenger/refund-change/${orderId}`)
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.order-detail {
  padding: 20px;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 20px;
}

.section:last-child {
  border-bottom: none;
}

.section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.label {
  width: 140px;
  color: #909399;
}

.amount {
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
}
</style>
