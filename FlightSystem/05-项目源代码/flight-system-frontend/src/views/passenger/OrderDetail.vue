<template>
  <div class="order-detail">
    <h1>{{ $t('orderDetail.title') }}</h1>

    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('common.order') }} {{ order?.order_no }}</span>
          <el-tag :type="orderStatusType(order?.status)">{{ orderStatusText(order?.status) }}</el-tag>
        </div>
      </template>

      <div v-if="order" class="sections">
        <div class="section">
          <h3>{{ $t('orderDetail.flightInfo') }}</h3>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.flightNo') }}:</span>
            <span>{{ order.schedule?.flight?.flight_no }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.route') }}:</span>
            <span>{{ order.schedule?.flight?.departureAirport?.city_name }} ({{ order.schedule?.flight?.departureAirport?.airport_code }}) → {{ order.schedule?.flight?.arrivalAirport?.city_name }} ({{ order.schedule?.flight?.arrivalAirport?.airport_code }})</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.departure') }}:</span>
            <span>{{ formatDateTime(order.schedule?.departure_time) }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.arrival') }}:</span>
            <span>{{ formatDateTime(order.schedule?.arrival_time) }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.aircraft') }}:</span>
            <span>{{ order.schedule?.aircraft?.model }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.cabinClass') }}:</span>
            <span>{{ cabinClassText(order.cabin_class) }}</span>
          </div>
        </div>

        <div class="section">
          <h3>{{ $t('orderDetail.passengers') }}</h3>
          <el-table :data="order.passengers" border>
            <el-table-column prop="name" :label="$t('orderDetail.name')" />
            <el-table-column prop="id_card" :label="$t('orderDetail.idCard')" />
            <el-table-column prop="ticket_no" :label="$t('orderDetail.ticketNo')" />
            <el-table-column prop="ticket.seat_no" :label="$t('orderDetail.seat')" />
          </el-table>
        </div>

        <div class="section">
          <h3>{{ $t('orderDetail.contactPayment') }}</h3>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.contactName') }}:</span>
            <span>{{ order.contact_name }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.contactPhone') }}:</span>
            <span>{{ order.contact_phone }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.totalAmount') }}:</span>
            <span class="amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="info-row">
            <span class="label">{{ $t('orderDetail.payTime') }}:</span>
            <span>{{ order.pay_time ? formatDateTime(order.pay_time) : '-' }}</span>
          </div>
        </div>

        <div class="section actions">
          <el-button v-if="order.status === 0" type="primary" @click="goPay">{{ $t('orderDetail.payNow') }}</el-button>
          <el-button v-if="order.status === 0" type="danger" @click="cancelOrder">{{ $t('orderDetail.cancelOrder') }}</el-button>
          <el-button v-if="order.status >= 2" type="primary" @click="goCheckIn">{{ $t('orderDetail.checkIn') }}</el-button>
          <el-button v-if="order.status >= 2" @click="goItinerary">{{ $t('orderDetail.itinerary') }}</el-button>
          <el-button v-if="canRefundChange && order.status >= 1" @click="goRefundChange">{{ $t('orderDetail.refundChange') }}</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderDetail, cancelOrder as cancelOrderApi } from '@/api/booking'
import { useUserStore } from '@/stores/user'
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { formatDateTime, cabinClassText, orderStatusType, orderStatusText } = useI18nHelpers()
const userStore = useUserStore()

const orderId = route.params.id

const loading = ref(false)
const order = ref(null)

const canRefundChange = computed(() => userStore.isPassenger)

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
    await ElMessageBox.confirm(t('orderDetail.cancelConfirm'), t('common.confirm'), { type: 'warning' })
    await cancelOrderApi(orderId)
    ElMessage.success(t('myOrders.cancelled'))
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
