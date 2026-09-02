<template>
  <div class="flight-status-manage">
    <h1>{{ $t('flightStatusManage.title') }}</h1>

    <el-card class="search-card">
      <el-form :model="query" inline>
        <el-form-item :label="$t('flightStatusManage.flightNo')">
          <el-input v-model="query.flightNo" :placeholder="$t('flightStatusManage.flightNo')" clearable />
        </el-form-item>
        <el-form-item :label="$t('flightStatusManage.date')">
          <el-date-picker v-model="query.flightDate" type="date" value-format="YYYY-MM-DD" :placeholder="$t('flightStatusManage.date')" />
        </el-form-item>
        <el-form-item :label="$t('flightStatusManage.status')">
          <el-select v-model="query.status" :placeholder="$t('flightStatusManage.status')" clearable>
            <el-option :label="$t('flightManage.normal')" :value="1" />
            <el-option :label="$t('flightManage.delayed')" :value="2" />
            <el-option :label="$t('flightManage.cancelled')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadStatuses">{{ $t('flightStatusManage.search') }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="result-card">
      <el-table :data="statusList" border>
        <el-table-column prop="flight.flight_no" :label="$t('flightStatusManage.flightNo')" />
        <el-table-column :label="$t('flightManage.departure')">
          <template #default="{ row }">
            {{ row.flight?.departureAirport?.airport_code }} → {{ row.flight?.arrivalAirport?.airport_code }}
          </template>
        </el-table-column>
        <el-table-column prop="flight_date" :label="$t('flightStatusManage.date')" />
        <el-table-column prop="departure_time" :label="$t('flightManage.departureTime')" />
        <el-table-column prop="arrival_time" :label="$t('flightManage.arrivalTime')" />
        <el-table-column :label="$t('flightStatusManage.status')">
          <template #default="{ row }">
            <el-tag :type="flightStatusType(row.status)">{{ flightStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="delay_minutes" :label="$t('flightStatusManage.delay')" />
        <el-table-column :label="$t('common.actions')" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="openStatusDialog(row)">{{ $t('common.update') }}</el-button>
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

    <el-dialog v-model="dialogVisible" :title="$t('flightStatusManage.updateStatus')" width="400px">
      <el-form :model="statusForm" label-width="120px">
        <el-form-item :label="$t('flightStatusManage.status')">
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
        <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveStatus">{{ $t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { listFlightStatuses } from '@/api/flightStatus'
import { updateScheduleStatus } from '@/api/flight'
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const { t } = useI18n()
const { flightStatusType, flightStatusText } = useI18nHelpers()

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
    ElMessage.success(t('flightStatusManage.saved'))
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
