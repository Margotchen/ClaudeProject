<template>
  <div class="itinerary-page">
    <h1>{{ $t('itinerary.title') }}</h1>

    <el-card v-loading="loading" class="itinerary-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('common.order') }} {{ order?.order_no }}</span>
          <el-button type="primary" @click="downloadPDF">{{ $t('itinerary.downloadPDF') }}</el-button>
        </div>
      </template>

      <div v-if="order" class="itinerary-content">
        <div class="section">
          <h3>{{ $t('itinerary.flightInfo') }}</h3>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.flightNo') }}:</span>
            <span>{{ order.schedule?.flight?.flight_no }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('itinerary.route') }}:</span>
            <span>{{ order.schedule?.flight?.departureAirport?.city_name }} ({{ order.schedule?.flight?.departureAirport?.airport_code }}) → {{ order.schedule?.flight?.arrivalAirport?.city_name }} ({{ order.schedule?.flight?.arrivalAirport?.airport_code }})</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('itinerary.departure') }}:</span>
            <span>{{ formatDateTime(order.schedule?.departure_time) }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('itinerary.arrival') }}:</span>
            <span>{{ formatDateTime(order.schedule?.arrival_time) }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('itinerary.aircraft') }}:</span>
            <span>{{ order.schedule?.aircraft?.model }}</span>
          </div>
        </div>

        <div class="section">
          <h3>{{ $t('itinerary.passengers') }}</h3>
          <el-table :data="order.passengers" border>
            <el-table-column type="index" width="50" />
            <el-table-column prop="name" :label="$t('orderDetail.name')" />
            <el-table-column prop="id_card" :label="$t('orderDetail.idCard')" />
            <el-table-column prop="ticket.ticket_no" :label="$t('orderDetail.ticketNo')" />
            <el-table-column prop="ticket.seat_no" :label="$t('orderDetail.seat')" />
          </el-table>
        </div>

        <div class="section">
          <h3>{{ $t('itinerary.payment') }}</h3>
          <div class="info-row">
            <span class="label">{{ $t('itinerary.totalAmount') }}:</span>
            <span class="amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('itinerary.paymentStatus') }}:</span>
            <span>{{ order.payments?.[0]?.pay_status === 1 ? $t('itinerary.paid') : $t('itinerary.unpaid') }}</span>
          </div>
          <div v-if="order.payments?.[0]?.transaction_no" class="info-row">
            <span class="label">{{ $t('itinerary.transactionNo') }}:</span>
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
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const route = useRoute()
const { t } = useI18n()
const { formatDateTime } = useI18nHelpers()

const orderId = route.params.orderId

const loading = ref(false)
const order = ref(null)

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
    ElMessage.error(t('itinerary.downloadFailed'))
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
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section h3 {
  margin-bottom: 15px;
  color: var(--color-text-primary);
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.label {
  width: 140px;
  color: var(--color-text-placeholder);
}

.amount {
  color: var(--color-danger);
  font-size: 16px;
  font-weight: bold;
}
</style>
