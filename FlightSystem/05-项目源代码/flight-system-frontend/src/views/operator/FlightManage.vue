<template>
  <div class="flight-manage">
    <h1>{{ $t('flightManage.title') }}</h1>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('flightManage.flights') }}</span>
          <el-button type="primary" @click="openFlightDialog()">{{ $t('flightManage.addFlight') }}</el-button>
        </div>
      </template>
      <el-table :data="flightList" v-loading="flightLoading" border>
        <el-table-column prop="flight_no" :label="$t('flightManage.flightNo')" />
        <el-table-column :label="$t('flightManage.departure')">
          <template #default="{ row }">
            {{ row.departureAirport?.airport_code }} - {{ row.departureAirport?.city_name }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('flightManage.arrival')">
          <template #default="{ row }">
            {{ row.arrivalAirport?.airport_code }} - {{ row.arrivalAirport?.city_name }}
          </template>
        </el-table-column>
        <el-table-column prop="planned_duration" :label="$t('flightManage.duration')" />
        <el-table-column :label="$t('common.actions')" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openFlightDialog(row)">{{ $t('common.edit') }}</el-button>
            <el-button size="small" type="danger" @click="deleteFlight(row)">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.noData')" :image-size="80" />
        </template>
      </el-table>
      <el-pagination
        v-model:current-page="flightQuery.page"
        v-model:page-size="flightQuery.pageSize"
        :total="flightTotal"
        layout="total, prev, pager, next"
        @current-change="loadFlights"
      />
    </el-card>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>{{ $t('flightManage.schedules') }}</span>
          <el-button type="primary" @click="openScheduleDialog()">{{ $t('flightManage.addSchedule') }}</el-button>
        </div>
      </template>
      <el-table :data="scheduleList" v-loading="scheduleLoading" border>
        <el-table-column prop="flight.flight_no" :label="$t('flightManage.flightNo')" />
        <el-table-column :label="$t('flightManage.departure')">
          <template #default="{ row }">
            {{ row.flight?.departureAirport?.airport_code }} → {{ row.flight?.arrivalAirport?.airport_code }}
          </template>
        </el-table-column>
        <el-table-column prop="flight_date" :label="$t('flightManage.flightDate')" />
        <el-table-column prop="departure_time" :label="$t('flightManage.departureTime')" />
        <el-table-column prop="arrival_time" :label="$t('flightManage.arrivalTime')" />
        <el-table-column prop="aircraft.model" :label="$t('flightManage.aircraft')" />
        <el-table-column :label="$t('flightManage.prices')">
          <template #default="{ row }">
            E: {{ row.economy_price }} / B: {{ row.business_price }} / F: {{ row.first_price }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('flightManage.status')">
          <template #default="{ row }">
            <el-tag :type="flightStatusType(row.status)">{{ flightStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="openScheduleDialog(row)">{{ $t('common.edit') }}</el-button>
            <el-button size="small" type="danger" @click="deleteSchedule(row)">{{ $t('common.delete') }}</el-button>
            <el-button size="small" @click="openStatusDialog(row)">{{ $t('flightManage.updateStatus') }}</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :description="$t('common.noData')" :image-size="80" />
        </template>
      </el-table>
      <el-pagination
        v-model:current-page="scheduleQuery.page"
        v-model:page-size="scheduleQuery.pageSize"
        :total="scheduleTotal"
        layout="total, prev, pager, next"
        @current-change="loadSchedules"
      />
    </el-card>

    <!-- Flight Dialog -->
    <el-dialog v-model="flightDialogVisible" :title="flightForm.id ? $t('flightManage.editFlight') : $t('flightManage.addFlight')" width="500px">
      <el-form :model="flightForm" label-width="140px">
        <el-form-item :label="$t('flightManage.flightNo')">
          <el-input v-model="flightForm.flightNo" />
        </el-form-item>
        <el-form-item :label="$t('flightManage.departureAirport')">
          <el-select v-model="flightForm.departureAirportCode" :placeholder="$t('common.select')">
            <el-option v-for="a in airportList" :key="a.id" :label="`${a.airport_code} - ${a.city_name}`" :value="a.airport_code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightManage.arrivalAirport')">
          <el-select v-model="flightForm.arrivalAirportCode" :placeholder="$t('common.select')">
            <el-option v-for="a in airportList" :key="a.id" :label="`${a.airport_code} - ${a.city_name}`" :value="a.airport_code" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightManage.duration')">
          <el-input-number v-model="flightForm.plannedDuration" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="flightDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveFlight">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Schedule Dialog -->
    <el-dialog v-model="scheduleDialogVisible" :title="scheduleForm.id ? $t('flightManage.editSchedule') : $t('flightManage.addSchedule')" width="500px">
      <el-form :model="scheduleForm" label-width="140px">
        <el-form-item :label="$t('flightManage.flightNo')">
          <el-select v-model="scheduleForm.flightId" :placeholder="$t('common.select')">
            <el-option v-for="f in flightList" :key="f.id" :label="f.flight_no" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightManage.aircraft')">
          <el-select v-model="scheduleForm.aircraftId" :placeholder="$t('common.select')">
            <el-option v-for="a in aircraftList" :key="a.id" :label="a.model" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightManage.flightDate')">
          <el-date-picker v-model="scheduleForm.flightDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item :label="$t('flightManage.departureTime')">
          <el-date-picker v-model="scheduleForm.departureTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item :label="$t('flightManage.arrivalTime')">
          <el-date-picker v-model="scheduleForm.arrivalTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item :label="$t('flightManage.economyPrice')">
          <el-input-number v-model="scheduleForm.economyPrice" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('flightManage.businessPrice')">
          <el-input-number v-model="scheduleForm.businessPrice" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('flightManage.firstPrice')">
          <el-input-number v-model="scheduleForm.firstPrice" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveSchedule">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Status Dialog -->
    <el-dialog v-model="statusDialogVisible" :title="$t('flightManage.updateStatus')" width="400px">
      <el-form :model="statusForm" label-width="120px">
        <el-form-item :label="$t('flightManage.status')">
          <el-select v-model="statusForm.status">
            <el-option :label="$t('flightManage.normal')" :value="1" />
            <el-option :label="$t('flightManage.delayed')" :value="2" />
            <el-option :label="$t('flightManage.cancelled')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('flightStatusManage.delay')">
          <el-input-number v-model="statusForm.delayMinutes" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('common.reason')">
          <el-input v-model="statusForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveStatus">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFlightList, createFlight, updateFlight, deleteFlight as removeFlight,
  getScheduleList, createSchedule, updateSchedule, deleteSchedule as removeSchedule,
  updateScheduleStatus
} from '@/api/flight'
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const { t } = useI18n()
const { flightStatusType, flightStatusText } = useI18nHelpers()

const flightLoading = ref(false)
const scheduleLoading = ref(false)
const flightList = ref([])
const scheduleList = ref([])
const airportList = ref([
  { id: 1, airport_code: 'PEK', city_name: 'Beijing' },
  { id: 2, airport_code: 'SHA', city_name: 'Shanghai' },
  { id: 3, airport_code: 'CAN', city_name: 'Guangzhou' },
  { id: 4, airport_code: 'SZX', city_name: 'Shenzhen' },
  { id: 5, airport_code: 'TFU', city_name: 'Chengdu' }
])
const aircraftList = ref([
  { id: 1, model: 'Airbus A320-200' },
  { id: 2, model: 'Boeing 737-800' }
])
const flightTotal = ref(0)
const scheduleTotal = ref(0)

const flightQuery = reactive({ page: 1, pageSize: 10 })
const scheduleQuery = reactive({ page: 1, pageSize: 10 })

const flightDialogVisible = ref(false)
const scheduleDialogVisible = ref(false)
const statusDialogVisible = ref(false)

const flightForm = reactive({ id: null, flightNo: '', departureAirportCode: '', arrivalAirportCode: '', plannedDuration: 120 })
const scheduleForm = reactive({ id: null, flightId: null, aircraftId: null, flightDate: '', departureTime: '', arrivalTime: '', economyPrice: 500, businessPrice: 1250, firstPrice: 2500 })
const statusForm = reactive({ id: null, status: 1, delayMinutes: 0, reason: '' })

const loadFlights = async () => {
  flightLoading.value = true
  try {
    const res = await getFlightList(flightQuery)
    flightList.value = res.data.list
    flightTotal.value = res.data.pagination.total
  } finally {
    flightLoading.value = false
  }
}

const loadSchedules = async () => {
  scheduleLoading.value = true
  try {
    const res = await getScheduleList(scheduleQuery)
    scheduleList.value = res.data.list
    scheduleTotal.value = res.data.pagination.total
  } finally {
    scheduleLoading.value = false
  }
}

const openFlightDialog = (row = null) => {
  if (row) {
    Object.assign(flightForm, {
      id: row.id,
      flightNo: row.flight_no,
      departureAirportCode: row.departureAirport?.airport_code,
      arrivalAirportCode: row.arrivalAirport?.airport_code,
      plannedDuration: row.planned_duration
    })
  } else {
    Object.assign(flightForm, { id: null, flightNo: '', departureAirportCode: '', arrivalAirportCode: '', plannedDuration: 120 })
  }
  flightDialogVisible.value = true
}

const saveFlight = async () => {
  try {
    if (flightForm.id) {
      await updateFlight(flightForm.id, flightForm)
    } else {
      await createFlight(flightForm)
    }
    ElMessage.success(t('flightManage.saved'))
    flightDialogVisible.value = false
    loadFlights()
  } catch (err) {
    console.error(err)
  }
}

const deleteFlight = async (row) => {
  try {
    await ElMessageBox.confirm(t('flightManage.deleteConfirm'), t('common.confirm'), { type: 'warning' })
    await removeFlight(row.id)
    ElMessage.success(t('flightManage.deleted'))
    loadFlights()
  } catch (err) {
    // cancelled
  }
}

const openScheduleDialog = (row = null) => {
  if (row) {
    Object.assign(scheduleForm, {
      id: row.id,
      flightId: row.flight_id,
      aircraftId: row.aircraft_id,
      flightDate: row.flight_date,
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
      economyPrice: row.economy_price,
      businessPrice: row.business_price,
      firstPrice: row.first_price
    })
  } else {
    Object.assign(scheduleForm, { id: null, flightId: null, aircraftId: null, flightDate: '', departureTime: '', arrivalTime: '', economyPrice: 500, businessPrice: 1250, firstPrice: 2500 })
  }
  scheduleDialogVisible.value = true
}

const saveSchedule = async () => {
  try {
    if (scheduleForm.id) {
      await updateSchedule(scheduleForm.id, scheduleForm)
    } else {
      await createSchedule(scheduleForm)
    }
    ElMessage.success(t('flightManage.saved'))
    scheduleDialogVisible.value = false
    loadSchedules()
  } catch (err) {
    console.error(err)
  }
}

const deleteSchedule = async (row) => {
  try {
    await ElMessageBox.confirm(t('flightManage.deleteScheduleConfirm'), t('common.confirm'), { type: 'warning' })
    await removeSchedule(row.id)
    ElMessage.success(t('flightManage.deleted'))
    loadSchedules()
  } catch (err) {
    // cancelled
  }
}

const openStatusDialog = (row) => {
  Object.assign(statusForm, { id: row.id, status: row.status, delayMinutes: row.delay_minutes, reason: '' })
  statusDialogVisible.value = true
}

const saveStatus = async () => {
  try {
    await updateScheduleStatus(statusForm.id, statusForm)
    ElMessage.success(t('flightManage.statusUpdated'))
    statusDialogVisible.value = false
    loadSchedules()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  loadFlights()
  loadSchedules()
})
</script>

<style scoped>
.flight-manage {
  padding: 20px;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
