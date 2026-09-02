<template>
  <div class="itinerary-page">
    <h1>Itinerary</h1>

    <el-card v-loading="loading" class="itinerary-card">
      <template #header>
        <div class="card-header">
          <span>Order {{ order?.order_no }}</span>
          <el-button type="primary" @click="downloadPDF">Download PDF</el-button>
        </div>
      </template>

      <div v-if="order" class="itinerary-content">
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
        </div>

        <div class="section">
          <h3>Passengers</h3>
          <el-table :data="order.passengers" border>
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" label="Name" />
            <el-table-column prop="id_card" label="ID Card" />
            <el-table-column prop="ticket.ticket_no" label="Ticket No" />
            <el-table-column prop="ticket.seat_no" label="Seat" />
          </el-table>
        </div>

        <div class="section">
          <h3>Payment</h3>
          <div class="info-row">
            <span class="label">Total Amount:</span>
            <span class="amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="info-row">
            <span class="label">Payment Status:</span>
            <span>{{ order.payments?.[0]?.pay_status === 1 ? 'Paid' : 'Unpaid' }}</span>
          </div>
          <div v-if="order.payments?.[0]?.transaction_no" class="info-row">
            <span class="label">Transaction No:</span>
            <span>{{ order.payments[0].transaction_no }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getItinerary, downloadItineraryPDF } from '@/api/itinerary'

const route = useRoute()
const orderId = route.params.orderId

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

const loadItinerary = async () => {
  loading.value = true
  try {
    const res = await getItinerary(orderId)
    order.value = res.data
  } finally {
    loading.value = false
  }
}

const downloadPDF = async () => {
  try {
    const res = await downloadItineraryPDF(orderId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `itinerary-${order.value?.order_no || orderId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    ElMessage.error('Download failed')
    console.error(err)
  }
}

onMounted(() => {
  loadItinerary()
})
</script>

<style scoped>
.itinerary-page {
  padding: 20px;
}

.itinerary-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
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
</style>
