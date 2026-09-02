<template>
  <div class="passenger-orders">
    <h1>{{ $t('menu.passengerOrders') }}</h1>

    <el-card v-loading="loading">
      <el-form :model="query" inline>
        <el-form-item :label="$t('common.status')">
          <el-select v-model="query.status" clearable :placeholder="$t('common.status')" style="width: 120px;">
            <el-option v-for="(label, value) in statusOptions" :key="value" :label="label" :value="parseInt(value)" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('myOrders.orderNo')">
          <el-input v-model="query.keyword" clearable :placeholder="$t('myOrders.orderNo')" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrders">{{ $t('common.search') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="orderList" border>
        <el-table-column prop="order_no" :label="$t('myOrders.orderNo')" width="180" />
        <el-table-column prop="user.username" :label="$t('login.username')" width="120" />
        <el-table-column :label="$t('myOrders.flight')">
          <template #default="{ row }">
            {{ row.schedule?.flight?.flight_no }}
            <br />
            <span class="route-text">
              {{ row.schedule?.flight?.departureAirport?.airport_code }} → {{ row.schedule?.flight?.arrivalAirport?.airport_code }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('myOrders.departure')" width="160">
          <template #default="{ row }">
            {{ formatDate(row.schedule?.departure_time) }}
            <br />
            {{ formatTime(row.schedule?.departure_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="cabin_class" :label="$t('myOrders.cabin')">
          <template #default="{ row }">
            {{ cabinClassText(row.cabin_class) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" :label="$t('myOrders.amount')" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" width="120">
          <template #default="{ row }">
            <el-tag :type="orderStatusType(row.status)">{{ orderStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('myOrders.actions')" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">{{ $t('common.detail') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOrders"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAllOrders } from '@/api/booking'
import { useI18n } from '@/composables/useI18n'
import { useI18nHelpers } from '@/composables/useI18nHelpers'

const router = useRouter()
const { t } = useI18n()
const { formatDate, formatTime, cabinClassText, orderStatusType, orderStatusText } = useI18nHelpers()

const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 10, status: '', keyword: '' })

const statusOptions = computed(() => ({
  0: t('orderStatus.pending'),
  1: t('orderStatus.paid'),
  2: t('orderStatus.ticketed'),
  3: t('orderStatus.checkedIn'),
  4: t('orderStatus.changed'),
  5: t('orderStatus.refunded'),
  6: t('orderStatus.cancelled')
}))

const loadOrders = async () => {
  loading.value = true
  try {
    const params = { ...query }
    if (params.status === '' || params.status == null) {
      delete params.status
    }
    const res = await getAllOrders(params)
    orderList.value = res.data.list
    total.value = res.data.pagination.total
  } catch (err) {
    ElMessage.error(err?.message || t('common.unknown'))
  } finally {
    loading.value = false
  }
}

const viewOrder = (row) => {
  router.push(`/passenger/order/${row.id}`)
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.passenger-orders {
  padding: 20px;
}

.route-text {
  color: #909399;
  font-size: 12px;
}
</style>
