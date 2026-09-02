<template>
  <div class="booking-page">
    <h1>Book Flight</h1>

    <el-card v-loading="loading" class="flight-card">
      <div v-if="schedule" class="flight-summary">
        <div class="flight-no">{{ schedule.flight?.flight_no }}</div>
        <div class="route">
          <div class="airport">
            <div class="code">{{ schedule.flight?.departureAirport?.airport_code }}</div>
            <div class="city">{{ schedule.flight?.departureAirport?.city_name }}</div>
          </div>
          <div class="arrow">→</div>
          <div class="airport">
            <div class="code">{{ schedule.flight?.arrivalAirport?.airport_code }}</div>
            <div class="city">{{ schedule.flight?.arrivalAirport?.city_name }}</div>
          </div>
        </div>
        <div class="time">
          <div>{{ formatDate(schedule.departure_time) }}</div>
          <div>{{ formatTime(schedule.departure_time) }} - {{ formatTime(schedule.arrival_time) }}</div>
        </div>
        <div class="aircraft">{{ schedule.aircraft?.model }}</div>
      </div>
    </el-card>

    <el-card class="booking-card">
      <template #header>
        <div class="card-header">
          <span>Passengers</span>
          <el-button type="primary" size="small" @click="addPassenger">Add Passenger</el-button>
        </div>
      </template>

      <el-form :model="bookingForm" label-width="120px">
        <el-form-item label="Cabin Class">
          <el-radio-group v-model="bookingForm.cabinClass">
            <el-radio-button label="economy">Economy ¥{{ schedule?.economy_price }}</el-radio-button>
            <el-radio-button label="business">Business ¥{{ schedule?.business_price }}</el-radio-button>
            <el-radio-button label="first">First ¥{{ schedule?.first_price }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-for="(p, index) in bookingForm.passengers" :key="index" class="passenger-row">
          <el-form-item :label="`Passenger ${index + 1}`">
            <el-input v-model="p.name" placeholder="Name" style="width: 180px; margin-right: 10px;" />
            <el-input v-model="p.idCard" placeholder="ID Card" style="width: 220px; margin-right: 10px;" />
            <el-button type="danger" size="small" @click="removePassenger(index)">Remove</el-button>
          </el-form-item>
        </div>

        <el-form-item label="Contact Name">
          <el-input v-model="bookingForm.contactName" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="Contact Phone">
          <el-input v-model="bookingForm.contactPhone" style="width: 300px;" />
        </el-form-item>

        <el-form-item label="Total Amount">
          <div class="total-amount">¥{{ totalAmount }}</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitBooking" :loading="submitting">Submit Order</el-button>
          <el-button @click="goBack">Back</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getScheduleDetail } from '@/api/flight'
import { createBooking } from '@/api/booking'

const route = useRoute()
const router = useRouter()
const scheduleId = route.params.scheduleId
const cabinFromQuery = route.query.cabin || 'economy'

const loading = ref(false)
const submitting = ref(false)
const schedule = ref(null)

const bookingForm = reactive({
  cabinClass: cabinFromQuery,
  passengers: [{ name: '', idCard: '' }],
  contactName: '',
  contactPhone: ''
})

const unitPrice = computed(() => {
  if (!schedule.value) return 0
  return schedule.value[`${bookingForm.cabinClass}_price`] || 0
})

const totalAmount = computed(() => {
  return unitPrice.value * bookingForm.passengers.length
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

const addPassenger = () => {
  const available = getAvailableSeats()
  if (bookingForm.passengers.length >= available) {
    ElMessage.warning('No more seats available in selected cabin')
    return
  }
  bookingForm.passengers.push({ name: '', idCard: '' })
}

const removePassenger = (index) => {
  bookingForm.passengers.splice(index, 1)
}

const getAvailableSeats = () => {
  if (!schedule.value) return 0
  const inv = schedule.value.seatInventories?.find(i => i.cabin_class === bookingForm.cabinClass)
  return inv ? inv.available_seats : 0
}

const loadSchedule = async () => {
  loading.value = true
  try {
    const res = await getScheduleDetail(scheduleId)
    schedule.value = res.data
    if (schedule.value.status === 3) {
      ElMessage.warning('This flight has been cancelled')
    }
  } finally {
    loading.value = false
  }
}

const validate = () => {
  if (!bookingForm.cabinClass) {
    ElMessage.warning('Please select cabin class')
    return false
  }
  const available = getAvailableSeats()
  if (bookingForm.passengers.length > available) {
    ElMessage.warning('Not enough seats available')
    return false
  }
  for (const p of bookingForm.passengers) {
    if (!p.name.trim() || !p.idCard.trim()) {
      ElMessage.warning('Please fill in all passenger information')
      return false
    }
  }
  if (!bookingForm.contactName.trim() || !bookingForm.contactPhone.trim()) {
    ElMessage.warning('Please fill in contact information')
    return false
  }
  return true
}

const submitBooking = async () => {
  if (!validate()) return
  submitting.value = true
  try {
    const res = await createBooking({
      scheduleId: parseInt(scheduleId),
      cabinClass: bookingForm.cabinClass,
      passengers: bookingForm.passengers.map(p => ({ name: p.name.trim(), idCard: p.idCard.trim() })),
      contactName: bookingForm.contactName.trim(),
      contactPhone: bookingForm.contactPhone.trim()
    })
    ElMessage.success('Order created')
    router.push(`/passenger/order/${res.data.id}`)
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadSchedule()
})
</script>

<style scoped>
.booking-page {
  padding: 20px;
}

.flight-card,
.booking-card {
  margin-bottom: 20px;
}

.flight-summary {
  display: flex;
  align-items: center;
  gap: 40px;
}

.flight-no {
  font-size: 18px;
  font-weight: bold;
  width: 120px;
}

.route {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.airport {
  text-align: center;
}

.code {
  font-size: 24px;
  font-weight: bold;
}

.city {
  color: #909399;
  font-size: 12px;
}

.arrow {
  font-size: 24px;
  color: #c0c4cc;
}

.time {
  width: 200px;
}

.aircraft {
  color: #606266;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.passenger-row {
  margin-left: 120px;
  margin-bottom: 10px;
}

.total-amount {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
}
</style>
