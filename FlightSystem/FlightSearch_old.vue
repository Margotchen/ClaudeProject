<template>
  <div class="flight-search">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="$t('flightSearch.origin')">
          <el-select v-model="searchForm.origin" :placeholder="$t('flightSearch.originPlaceholder')" style="width: 220px">
            <el-option v-for="a in airports" :key="a.code" :label="`${a.city} (${a.code})`" :value="a.code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightSearch.destination')">
          <el-select v-model="searchForm.destination" :placeholder="$t('flightSearch.destinationPlaceholder')" style="width: 220px">
            <el-option v-for="a in airports" :key="a.code" :label="`${a.city} (${a.code})`" :value="a.code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightSearch.date')">
          <el-date-picker v-model="searchForm.date" type="date" value-format="YYYY-MM-DD" :disabled-date="disabledDate" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">{{ $t('common.search') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="result-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('flightSearch.results') }}</span>
          <span v-if="pagination.total">{{ $t('flightSearch.found', { count: pagination.total }) }}</span>
        </div>
      </template>

      <div v-if="flightList.length === 0 && !loading" class="empty-tip">
        {{ $t('flightSearch.emptyTip') }}
      </div>

      <div v-for="item in flightList" :key="item.id" class="flight-item">
        <div class="flight-info">
          <div class="airline">{{ item.flight?.flight_no }}</div>
          <div class="route">
            <div class="airport">
              <div class="time">{{ formatTime(item.departure_time) }}</div>
              <div class="code">{{ item.flight?.departureAirport?.airport_code }}</div>
              <div class="city">{{ item.flight?.departureAirport?.city_name }}</div>
            </div>
            <div class="arrow">→</div>
            <div class="airport">
              <div class="time">{{ formatTime(item.arrival_time) }}</div>
              <div class="code">{{ item.flight?.arrivalAirport?.airport_code }}</div>
              <div class="city">{{ item.flight?.arrivalAirport?.city_name }}</div>
            </div>
          </div>
          <div class="aircraft">{{ item.aircraft?.model }}</div>
          <div class="status">
            <el-tag :type="flightStatusType(item.status)">{{ flightStatusText(item.status) }}</el-tag>
            <span v-if="item.delay_minutes > 0" class="delay">+{{ item.delay_minutes }} min</span>
          </div>
        </div>

        <div class="cabin-list">
          <div v-for="cabin in cabinClasses" :key="cabin.key" class="cabin-item">
            <div class="cabin-name">{{ cabin.label }}</div>
            <div class="price">¥{{ getCabinPrice(item, cabin.key) }}</div>
            <div class="seats">{{ $t('flightSearch.seatsLeft', { count: getCabinSeats(item, cabin.key) }) }}</div>
            <el-button type="primary" size="small" @click="goBooking(item, cabin.key)">{{ $t('flightSearch.book') }}</el-button>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="pagination.total > 0"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { searchFlights } from '@/api/flight'
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const router = useRouter()
const { t } = useI18n()
const { formatTime, flightStatusType, flightStatusText } = useI18nHelpers()

const loading = ref(false)
const flightList = ref([])

const airports = [
  { code: 'PEK', city: 'Beijing' },
  { code: 'SHA', city: 'Shanghai' },
  { code: 'CAN', city: 'Guangzhou' },
  { code: 'SZX', city: 'Shenzhen' },
  { code: 'TFU', city: 'Chengdu' }
]

const cabinClasses = computed(() => [
  { key: 'economy', label: t('cabin.economy') },
  { key: 'business', label: t('cabin.business') },
  { key: 'first', label: t('cabin.first') }
])

const searchForm = reactive({
  origin: 'PEK',
  destination: 'SHA',
  date: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const disabledDate = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const getCabinPrice = (item, cabin) => {
  return item[`${cabin}_price`] || 0
}

const getCabinSeats = (item, cabin) => {
  const inv = item.seatInventories?.find(i => i.cabin_class === cabin)
  return inv ? inv.available_seats : 0
}

const handleSearch = () => {
  if (!searchForm.origin || !searchForm.destination || !searchForm.date) {
    ElMessage.warning(t('flightSearch.missingFields'))
    return
  }
  if (searchForm.origin === searchForm.destination) {
    ElMessage.warning(t('flightSearch.sameAirport'))
    return
  }
  pagination.page = 1
  loadFlights()
}

const handlePageChange = () => {
  loadFlights()
}

const loadFlights = async () => {
  loading.value = true
  try {
    const res = await searchFlights({
      origin: searchForm.origin,
      destination: searchForm.destination,
      date: searchForm.date,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    flightList.value = res.data.list
    pagination.total = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const goBooking = (item, cabin) => {
  if (item.status === 3) {
    ElMessage.warning(t('flightSearch.cancelled'))
    return
  }
  const seats = getCabinSeats(item, cabin)
  if (seats <= 0) {
    ElMessage.warning(t('flightSearch.noSeats'))
    return
  }
  router.push(`/passenger/booking/${item.id}?cabin=${cabin}`)
}

onMounted(() => {
  const today = new Date()
  searchForm.date = today.toISOString().split('T')[0]
})
</script>

<style scoped>
.flight-search {
  padding: 20px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.flight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.flight-item:last-child {
  border-bottom: none;
}

.flight-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 30px;
}

.airline {
  font-weight: bold;
  font-size: 16px;
  width: 100px;
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

.time {
  font-size: 20px;
  font-weight: bold;
}

.code {
  color: #606266;
  font-size: 12px;
}

.city {
  color: #909399;
  font-size: 12px;
}

.arrow {
  font-size: 20px;
  color: #c0c4cc;
}

.aircraft {
  width: 140px;
  color: #606266;
}

.status {
  width: 120px;
}

.delay {
  color: #e6a23c;
  margin-left: 8px;
  font-size: 12px;
}

.cabin-list {
  display: flex;
  gap: 20px;
}

.cabin-item {
  width: 120px;
  text-align: center;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.cabin-name {
  font-size: 12px;
  color: #909399;
}

.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
  margin: 5px 0;
}

.seats {
  font-size: 12px;
  color: #67c23a;
  margin-bottom: 8px;
}
</style>
