<template>
  <div class="flight-status-manage">
    <h1>Flight Status</h1>

    <el-card class="search-card">
      <el-form :model="query" inline>
        <el-form-item label="Flight No">
          <el-input v-model="query.flightNo" placeholder="Flight No" clearable />
        </el-form-item>
        <el-form-item label="Date">
          <el-date-picker v-model="query.flightDate" type="date" value-format="YYYY-MM-DD" placeholder="Date" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="query.status" placeholder="Status" clearable>
            <el-option label="Normal" :value="1" />
            <el-option label="Delayed" :value="2" />
            <el-option label="Cancelled" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStatuses">Search</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="result-card">
      <el-table :data="statusList" border>
        <el-table-column prop="flight.flight_no" label="Flight No" />
        <el-table-column label="Route">
          <template #default="{ row }">
            {{ row.flight?.departureAirport?.airport_code }} → {{ row.flight?.arrivalAirport?.airport_code }}
          </template>
        </el-table-column>
        <el-table-column prop="flight_date" label="Date" />
        <el-table-column prop="departure_time" label="Departure" />
        <el-table-column prop="arrival_time" label="Arrival" />
        <el-table-column label="Status">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delay_minutes" label="Delay (min)" />
        <el-table-column label="Actions" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openStatusDialog(row)">Update</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadStatuses"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="Update Status" width="400px">
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
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveStatus">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listFlightStatuses } from '@/api/flightStatus'
import { updateScheduleStatus } from '@/api/flight'

const loading = ref(false)
const statusList = ref([])
const total = ref(0)
const dialogVisible = ref(false)

const query = reactive({
  page: 1,
  pageSize: 10,
  flightNo: '',
  flightDate: '',
  status: null
})

const statusForm = reactive({
  id: null,
  status: 1,
  delayMinutes: 0,
  reason: ''
})

const statusType = (status) => {
  return ['', 'success', 'warning', 'danger'][status] || 'info'
}
const statusText = (status) => {
  return ['', 'Normal', 'Delayed', 'Cancelled'][status] || 'Unknown'
}

const loadStatuses = async () => {
  loading.value = true
  try {
    const params = { ...query }
    if (!params.status) delete params.status
    const res = await listFlightStatuses(params)
    statusList.value = res.data.list
    total.value = res.data.pagination.total
  } finally {
    loading.value = false
  }
}

const openStatusDialog = (row) => {
  Object.assign(statusForm, {
    id: row.id,
    status: row.status,
    delayMinutes: row.delay_minutes || 0,
    reason: row.flightStatus?.reason || ''
  })
  dialogVisible.value = true
}

const saveStatus = async () => {
  try {
    await updateScheduleStatus(statusForm.id, {
      status: statusForm.status,
      delayMinutes: statusForm.delayMinutes,
      reason: statusForm.reason
    })
    ElMessage.success('Status updated')
    dialogVisible.value = false
    loadStatuses()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  loadStatuses()
})
</script>

<style scoped>
.flight-status-manage {
  padding: 20px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
}
</style>
