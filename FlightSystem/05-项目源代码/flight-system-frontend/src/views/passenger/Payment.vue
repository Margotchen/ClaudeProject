<template>
  <div class="payment-page">
    <h1>{{ $t('payment.title') }}</h1>

    <el-card v-loading="loading" class="order-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('common.order') }} {{ order?.order_no }}</span>
          <el-tag :type="orderStatusType(order?.status)">{{ orderStatusText(order?.status) }}</el-tag>
        </div>
      </template>

      <div v-if="order" class="order-info">
        <div class="info-row">
          <span class="label">{{ $t('payment.flight') }}:</span>
          <span>{{ order.schedule?.flight?.flight_no }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('payment.route') }}:</span>
          <span>{{ order.schedule?.flight?.departureAirport?.city_name }} ({{ order.schedule?.flight?.departureAirport?.airport_code }}) → {{ order.schedule?.flight?.arrivalAirport?.city_name }} ({{ order.schedule?.flight?.arrivalAirport?.airport_code }})</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('payment.departure') }}:</span>
          <span>{{ formatDateTime(order.schedule?.departure_time) }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('payment.cabin') }}:</span>
          <span>{{ cabinClassText(order.cabin_class) }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('payment.passengers') }}:</span>
          <span>{{ order.passengers?.length }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('payment.total') }}:</span>
          <span class="amount">¥{{ order.total_amount }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="pay-card">
      <template #header>
        <span>{{ $t('payment.method') }}</span>
      </template>
      <el-radio-group v-model="payForm.method">
        <el-radio label="simulate">{{ $t('payment.simulatedPayment') }}</el-radio>
      </el-radio-group>
      <div class="pay-actions">
        <el-button type="primary" size="large" :loading="paying" @click="handlePay">{{ $t('payment.payNow') }}</el-button>
        <el-button size="large" @click="goBack">{{ $t('common.back') }}</el-button>
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
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'
import { useGoBack } from '@/composables/useGoBack'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { formatDateTime, cabinClassText, orderStatusType, orderStatusText } = useI18nHelpers()

const orderId = route.params.orderId

const loading = ref(false)
const paying = ref(false)
const order = ref(null)

const payForm = reactive({
  method: 'simulate'
})

const loadOrder = async () => {
  loading.value = true
  try {
    const res = await getOrderDetail(orderId)
    order.value = res.data
    if (order.value.status !== 0) {
      ElMessage.info(t('payment.notPending'))
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
    ElMessage.success(res.message || t('payment.successful'))
    router.push(`/passenger/order/${orderId}`)
  } finally {
    paying.value = false
  }
}

const goBack = useGoBack(`/passenger/order/${orderId}`)

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
