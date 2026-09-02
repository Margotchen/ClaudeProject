<template>
  <div class="refund-change-page">
    <h1>Refund / Change</h1>

    <el-card v-loading="loading" class="order-card">
      <template #header>
        <span>Order {{ order?.order_no }}</span>
      </template>
      <div v-if="order" class="order-info">
        <div class="info-row">
          <span class="label">Flight:</span>
          <span>{{ order.schedule?.flight?.flight_no }}</span>
        </div>
        <div class="info-row">
          <span class="label">Route:</span>
          <span>{{ order.schedule?.flight?.departureAirport?.city_name }} → {{ order.schedule?.flight?.arrivalAirport?.city_name }}</span>
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
          <span class="label">Amount:</span>
          <span class="amount">¥{{ order.total_amount }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="form-card">
      <el-radio-group v-model="form.type" class="type-select">
        <el-radio-button label="refund">Refund</el-radio-button>
        <el-radio-button label="change">Change Flight</el-radio-button>
      </el-radio-group>

      <el-form :model="form" label-width="140px" class="apply-form">
        <el-form-item v-if="form.type === 'change'" label="Target Flight">
          <el-select v-model="form.targetScheduleId" placeholder="Select target flight" style="width: 300px;">
            <el-option v-for="s in targetSchedules" :key="s.id" :label="flightLabel(s)" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Reason">
          <el-input v-model="form.reason" type="textarea" style="width: 300px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">Submit Application</el-button>
          <el-button @click="goBack">Back</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOrderDetail } from '@/api/booking'
import { applyRefund, applyChange } from '@/api/refundChange'
import { searchFlights } from '@/api/flight'

const route = useRoute()
const router = useRouter()
const orderId = route.params.orderId

const loading = ref(false)
const submitting = ref(false)
const order = ref(null)
const targetSchedules = ref([])

const form = reactive({
  type: 'refund',
  targetScheduleId: null,
  reason: ''
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

const flightLabel = (s) => {
  return `${s.flight?.flight_no} ${s.flight?.departureAirport?.airport_code}→${s.flight?.arrivalAirport?.airport_code} ${formatDate(s.departure_time)} ${formatTime(s.departure_time)} ¥${s[`${order.value?.cabin_class}_price`]}`
}

const loadOrder = async () => {
  loading.value = true
  try {
    const res = await getOrderDetail(orderId)
    order.value = res.data
    if (form.type === 'change') {
      loadTargetSchedules()
    }
  } finally {
    loading.value = false
  }
}

const loadTargetSchedules = async () => {
  if (!order.value) return
  const flight = order.value.schedule?.flight
  if (!flight) return
  const date = order.value.schedule?.flight_date
  try {
    const res = await searchFlights({
      origin: flight.departureAirport?.airport_code,
      destination: flight.arrivalAirport?.airport_code,
      date,
      pageSize: 100
    })
    targetSchedules.value = res.data.list.filter(s => s.id !== order.value.schedule_id)
  } catch (err) {
    console.error(err)
  }
}

watch(() => form.type, (val) => {
  if (val === 'change') {
    loadTargetSchedules()
  }
})

const submit = async () => {
  if (!form.reason.trim()) {
    ElMessage.warning('Please enter reason')
    return
  }
  submitting.value = true
  try {
    if (form.type === 'refund') {
      await applyRefund({ orderId: parseInt(orderId), reason: form.reason })
    } else {
      if (!form.targetScheduleId) {
        ElMessage.warning('Please select target flight')
        return
      }
      await applyChange({
        orderId: parseInt(orderId),
        targetScheduleId: form.targetScheduleId,
        reason: form.reason
      })
    }
    ElMessage.success('Application submitted')
    router.push('/passenger/orders')
  } finally {
    submitting.value = false
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
.refund-change-page {
  padding: 20px;
}

.order-card,
.form-card {
  margin-bottom: 20px;
}

.order-info {
  padding: 10px 0;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.label {
  width: 120px;
  color: #909399;
}

.amount {
  color: #f56c6c;
  font-size: 16px;
  font-weight: bold;
}

.type-select {
  margin-bottom: 20px;
}

.apply-form {
  margin-top: 20px;
}
</style>
