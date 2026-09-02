<template>
  <div class="checkin-page">
    <h1>Check-in & Seat Selection</h1>

    <el-card v-loading="loading" class="info-card">
      <div v-if="seatMap">
        <div class="info-row">
          <span class="label">Cabin:</span>
          <span>{{ capitalize(seatMap.cabinClass) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Departure:</span>
          <span>{{ formatDate(seatMap.departureTime) }} {{ formatTime(seatMap.departureTime) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Order Status:</span>
          <el-tag :type="statusType(seatMap.orderStatus)">{{ statusText(seatMap.orderStatus) }}</el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="passenger-card">
      <template #header>
        <span>Passengers</span>
      </template>
      <div class="passenger-list">
        <div
          v-for="p in seatMap?.selectedSeats" :key="p.ticketId"
          class="passenger-item"
          :class="{ active: selectedPassenger?.ticketId === p.ticketId }"
          @click="selectPassenger(p)"
        >
          <div class="name">{{ p.passengerName }}</div>
          <div class="seat">{{ p.seatNo || 'No seat selected' }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="seat-card">
      <template #header>
        <span>Seat Map</span>
      </template>
      <div v-if="cabinLayout" class="seat-map">
        <div v-for="row in cabinLayout.rows" :key="row.row" class="seat-row">
          <div class="row-number">{{ row.row }}</div>
          <div class="seat-group">
            <div
              v-for="seat in row.seats"
              :key="seat.seatNo"
              class="seat"
              :class="{
                occupied: isOccupied(seat.seatNo),
                selected: isSelected(seat.seatNo),
                active: selectedPassenger && !isOccupied(seat.seatNo)
              }"
              @click="handleSeatClick(seat.seatNo)"
            >
              {{ seat.seatNo }}
            </div>
          </div>
        </div>
      </div>
      <div class="legend">
        <div class="legend-item"><span class="seat sample available" /> Available</div>
        <div class="legend-item"><span class="seat sample selected" /> Selected</div>
        <div class="legend-item"><span class="seat sample occupied" /> Occupied</div>
      </div>
    </el-card>

    <div class="actions">
      <el-button type="primary" size="large" :loading="checkingIn" @click="handleCheckIn">Check In</el-button>
      <el-button size="large" @click="goBack">Back</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSeatMap, selectSeat, checkIn } from '@/api/checkin'

const route = useRoute()
const router = useRouter()
const orderId = route.params.orderId

const loading = ref(false)
const checkingIn = ref(false)
const seatMap = ref(null)
const selectedPassenger = ref(null)

const cabinLayout = computed(() => {
  if (!seatMap.value) return null
  return seatMap.value.seats.find(s => s.cabin === seatMap.value.cabinClass)
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

const isOccupied = (seatNo) => {
  if (!seatMap.value) return false
  const selected = seatMap.value.selectedSeats.find(s => s.seatNo === seatNo)
  return selected && selected.ticketId !== selectedPassenger.value?.ticketId
}

const isSelected = (seatNo) => {
  if (!seatMap.value || !selectedPassenger.value) return false
  const selected = seatMap.value.selectedSeats.find(s => s.ticketId === selectedPassenger.value.ticketId)
  return selected && selected.seatNo === seatNo
}

const selectPassenger = (p) => {
  selectedPassenger.value = p
}

const handleSeatClick = async (seatNo) => {
  if (!selectedPassenger.value) {
    ElMessage.warning('Please select a passenger first')
    return
  }
  if (isOccupied(seatNo)) {
    return
  }
  try {
    await selectSeat({
      ticketId: selectedPassenger.value.ticketId,
      seatNo
    })
    ElMessage.success('Seat selected')
    loadSeatMap()
  } catch (err) {
    console.error(err)
  }
}

const handleCheckIn = async () => {
  const allSelected = seatMap.value?.selectedSeats.every(s => s.seatNo)
  if (!allSelected) {
    ElMessage.warning('Please select seats for all passengers')
    return
  }
  checkingIn.value = true
  try {
    const res = await checkIn(orderId)
    ElMessage.success(res.message)
    router.push(`/passenger/order/${orderId}`)
  } finally {
    checkingIn.value = false
  }
}

const loadSeatMap = async () => {
  loading.value = true
  try {
    const res = await getSeatMap(orderId)
    seatMap.value = res.data
    if (!selectedPassenger.value && seatMap.value?.selectedSeats.length > 0) {
      selectedPassenger.value = seatMap.value.selectedSeats[0]
    }
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadSeatMap()
})
</script>

<style scoped>
.checkin-page {
  padding: 20px;
}

.info-card,
.passenger-card,
.seat-card {
  margin-bottom: 20px;
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

.passenger-list {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.passenger-item {
  width: 200px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.passenger-item:hover,
.passenger-item.active {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.passenger-item .name {
  font-weight: bold;
  margin-bottom: 5px;
}

.passenger-item .seat {
  color: #909399;
  font-size: 12px;
}

.seat-map {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-x: auto;
  padding: 10px;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.row-number {
  width: 30px;
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.seat-group {
  display: flex;
  gap: 8px;
}

.seat {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background-color: #fff;
}

.seat.sample {
  cursor: default;
  width: 24px;
  height: 24px;
}

.seat.available:hover,
.seat.active:hover {
  border-color: #409eff;
  color: #409eff;
}

.seat.selected {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

.seat.occupied {
  background-color: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
  border-color: #e4e7ed;
}

.legend {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
}
</style>
