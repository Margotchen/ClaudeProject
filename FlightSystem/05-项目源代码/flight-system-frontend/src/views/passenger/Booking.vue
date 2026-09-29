<template>
  <div class="booking-page">
    <h1>{{ $t('booking.title') }}</h1>

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
          <span>{{ $t('booking.passengers') }}</span>
          <el-button type="primary" size="small" @click="addPassenger">{{ $t('booking.addPassenger') }}</el-button>
        </div>
      </template>

      <el-form :model="bookingForm" label-width="120px">
        <el-form-item :label="$t('booking.cabinClass')">
          <el-radio-group v-model="bookingForm.cabinClass">
            <el-radio-button label="economy">{{ cabinClassText('economy') }} ¥{{ schedule?.economy_price }}</el-radio-button>
            <el-radio-button label="business">{{ cabinClassText('business') }} ¥{{ schedule?.business_price }}</el-radio-button>
            <el-radio-button label="first">{{ cabinClassText('first') }} ¥{{ schedule?.first_price }}</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-for="(p, index) in bookingForm.passengers" :key="index" class="passenger-row">
          <el-form-item :label="$t('booking.passenger', { index: index + 1 })">
            <el-input v-model="p.name" :placeholder="$t('booking.namePlaceholder')" style="width: 180px; margin-right: 10px;" />
            <el-input v-model="p.idCard" :placeholder="$t('booking.idCardPlaceholder')" style="width: 220px; margin-right: 10px;" />
            <el-button type="danger" size="small" @click="removePassenger(index)">{{ $t('booking.remove') }}</el-button>
          </el-form-item>
        </div>

        <el-form-item :label="$t('booking.contactName')">
          <el-input v-model="bookingForm.contactName" style="width: 300px;" />
        </el-form-item>
        <el-form-item :label="$t('booking.contactPhone')">
          <el-input v-model="bookingForm.contactPhone" style="width: 300px;" />
        </el-form-item>

        <el-form-item :label="$t('booking.totalAmount')">
          <div class="total-amount">¥{{ totalAmount }}</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitBooking" :loading="submitting">{{ $t('booking.submitOrder') }}</el-button>
          <el-button @click="goBack">{{ $t('common.back') }}</el-button>
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
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'
import { useGoBack } from '@/composables/useGoBack'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { formatDate, formatTime, cabinClassText } = useI18nHelpers()

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

const addPassenger = () => {
  const available = getAvailableSeats()
  if (bookingForm.passengers.length >= available) {
    ElMessage.warning(t('booking.noMoreSeats'))
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
      ElMessage.warning(t('booking.cancelledFlight'))
    }
  } finally {
    loading.value = false
  }
}

const validate = () => {
  if (!bookingForm.cabinClass) {
    ElMessage.warning(t('booking.selectCabin'))
    return false
  }
  const available = getAvailableSeats()
  if (bookingForm.passengers.length > available) {
    ElMessage.warning(t('booking.notEnoughSeats'))
    return false
  }
  for (const p of bookingForm.passengers) {
    if (!p.name.trim() || !p.idCard.trim()) {
      ElMessage.warning(t('booking.fillPassenger'))
      return false
    }
  }
  if (!bookingForm.contactName.trim() || !bookingForm.contactPhone.trim()) {
    ElMessage.warning(t('booking.fillContact'))
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
    ElMessage.success(t('booking.orderCreated'))
    router.push(`/passenger/order/${res.data.id}`)
  } finally {
    submitting.value = false
  }
}

const goBack = useGoBack('/passenger/search')

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
  color: var(--color-text-placeholder);
  font-size: 12px;
}

.arrow {
  font-size: 24px;
  color: var(--color-text-placeholder);
}

.time {
  width: 200px;
}

.aircraft {
  color: var(--color-text-secondary);
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
  color: var(--color-danger);
  font-size: 24px;
  font-weight: bold;
}
</style>
