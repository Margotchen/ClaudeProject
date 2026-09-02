<template>
  <div class="flight-manage">
    <h1>Flight Management</h1>

    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>Flights</span>
          <el-button type="primary" @click="openFlightDialog()">Add Flight</el-button>
        </div>
      </template>
      <el-table :data="flightList" v-loading="flightLoading" border>
        <el-table-column prop="flight_no" label="Flight No" />
        <el-table-column label="Departure">
          <template #default="{ row }">
            {{ row.departureAirport?.airport_code }} - {{ row.departureAirport?.city_name }}
          </template>
        </el-table-column>
        <el-table-column label="Arrival">
          <template #default="{ row }">
            {{ row.arrivalAirport?.airport_code }} - {{ row.arrivalAirport?.city_name }}
          </template>
        </el-table-column>
        <el-table-column prop="planned_duration" label="Duration (min)" />
        <el-table-column label="Actions" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openFlightDialog(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="deleteFlight(row)">Delete</el-button>
          </template>
        </el-table-column>
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
          <span>Schedules</span>
          <el-button type="primary" @click="openScheduleDialog()">Add Schedule</el-button>
        </div>
      </template>
      <el-table :data="scheduleList" v-loading="scheduleLoading" border>
        <el-table-column prop="flight.flight_no" label="Flight No" />
        <el-table-column label="Route">
          <template #default="{ row }">
            {{ row.flight?.departureAirport?.airport_code }} → {{ row.flight?.arrivalAirport?.airport_code }}
          </template>
        </el-table-column>
        <el-table-column prop="flight_date" label="Date" />
        <el-table-column prop="departure_time" label="Departure" />
        <el-table-column prop="arrival_time" label="Arrival" />
        <el-table-column prop="aircraft.model" label="Aircraft" />
        <el-table-column label="Prices">
          <template #default="{ row }">
            E: {{ row.economy_price }} / B: {{ row.business_price }} / F: {{ row.first_price }}
          </template>
        </el-table-column>
        <el-table-column label="Status">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="openScheduleDialog(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="deleteSchedule(row)">Delete</el-button>
            <el-button size="small" @click="openStatusDialog(row)">Status</el-button>
          </template>
        </el-table-column>
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
    <el-dialog v-model="flightDialogVisible" :title="flightForm.id ? 'Edit Flight' : 'Add Flight'" width="500px">
      <el-form :model="flightForm" label-width="140px">
        <el-form-item label="Flight No">
          <el-input v-model="flightForm.flightNo" />
        </el-form-item>
        <el-form-item label="Departure Airport">
          <el-select v-model="flightForm.departureAirportCode" placeholder="Select">
            <el-option v-for="a in airportList" :key="a.id" :label="`${a.airport_code} - ${a.city_name}`" :value="a.airport_code" />
          </el-select>
        </el-form-item>
        <el-form-item label="Arrival Airport">
          <el-select v-model="flightForm.arrivalAirportCode" placeholder="Select">
            <el-option v-for="a in airportList" :key="a.id" :label="`${a.airport_code} - ${a.city_name}`" :value="a.airport_code" />
          </el-select>
        </el-form-item>
        <el-form-item label="Duration (min)">
          <el-input-number v-model="flightForm.plannedDuration" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="flightDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveFlight">Save</el-button>
      </template>
    </el-dialog>

    <!-- Schedule Dialog -->
    <el-dialog v-model="scheduleDialogVisible" :title="scheduleForm.id ? 'Edit Schedule' : 'Add Schedule'" width="500px">
      <el-form :model="scheduleForm" label-width="140px">
        <el-form-item label="Flight">
          <el-select v-model="scheduleForm.flightId" placeholder="Select">
            <el-option v-for="f in flightList" :key="f.id" :label="f.flight_no" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Aircraft">
          <el-select v-model="scheduleForm.aircraftId" placeholder="Select">
            <el-option v-for="a in aircraftList" :key="a.id" :label="a.model" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Flight Date">
          <el-date-picker v-model="scheduleForm.flightDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="Departure Time">
          <el-date-picker v-model="scheduleForm.departureTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="Arrival Time">
          <el-date-picker v-model="scheduleForm.arrivalTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="Economy Price">
          <el-input-number v-model="scheduleForm.economyPrice" :min="0" />
        </el-form-item>
        <el-form-item label="Business Price">
          <el-input-number v-model="scheduleForm.businessPrice" :min="0" />
        </el-form-item>
        <el-form-item label="First Price">
          <el-input-number v-model="scheduleForm.firstPrice" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveSchedule">Save</el-button>
      </template>
    </el-dialog>

    <!-- Status Dialog -->
    <el-dialog v-model="statusDialogVisible" title="Update Flight Status" width="400px">
      <el-form :model="statusForm" label-width="120px">
        <el-form-item label="Status">
          <el-select v-model="statusForm.status">
            <el-option label="Normal" :value="1" />
            <el-option label="Delayed" :value="2" />
            <el-option label="Cancelled" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="Delay (min)">
          <el-input-number v-model="statusForm.delayMinutes" :min="0" />
        </el-form-item>
        <el-form-item label="Reason">
          <el-input v-model="statusForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveStatus">Save</el-button>
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
    ElMessage.success('Saved')
    flightDialogVisible.value = false
    loadFlights()
  } catch (err) {
    console.error(err)
  }
}

const deleteFlight = async (row) => {
  try {
    await ElMessageBox.confirm('Delete this flight?', 'Confirm', { type: 'warning' })
    await removeFlight(row.id)
    ElMessage.success('Deleted')
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
    ElMessage.success('Saved')
    scheduleDialogVisible.value = false
    loadSchedules()
  } catch (err) {
    console.error(err)
  }
}

const deleteSchedule = async (row) => {
  try {
    await ElMessageBox.confirm('Delete this schedule?', 'Confirm', { type: 'warning' })
    await removeSchedule(row.id)
    ElMessage.success('Deleted')
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
    ElMessage.success('Status updated')
    statusDialogVisible.value = false
    loadSchedules()
  } catch (err) {
    console.error(err)
  }
}

const statusType = (status) => {
  return ['', 'success', 'warning', 'danger'][status] || 'info'
}
const statusText = (status) => {
  return ['', 'Normal', 'Delayed', 'Cancelled'][status] || 'Unknown'
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
