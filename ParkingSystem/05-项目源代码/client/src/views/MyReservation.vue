<template>
  <div class="page-container">
    <div class="page-header">
      <h2>我的预约</h2>
      <el-button type="primary" @click="$router.push('/parking-map')"><Plus /> 去预约</el-button>
    </div>

    <el-skeleton v-if="!listLoaded" :rows="5" animated />
    <el-table v-show="listLoaded" :data="reservations" border v-loading="loading">
      <el-table-column prop="reservation_no" label="预约单号" />
      <el-table-column prop="spot_code" label="车位" />
      <el-table-column prop="area_name" label="区域" />
      <el-table-column prop="reserve_date" label="日期" />
      <el-table-column prop="time_slot" label="时段">
        <template #default="{ row }">{{ slotText(row.time_slot) }}</template>
      </el-table-column>
      <el-table-column prop="plate_number" label="车牌" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'reserved'"
            size="small"
            type="primary"
            @click="handleCheckin(row)"
          >核销</el-button>
          <el-button
            v-if="row.status === 'reserved'"
            size="small"
            @click="handleCancel(row)"
          >取消</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无预约记录" :image-size="80" />
      </template>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyReservations, cancelReservation, checkinReservation } from '@/api/reservation';

const loading = ref(false);
const listLoaded = ref(false);
const reservations = ref([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10
});

function slotText(slot) {
  return {
    morning: '上午',
    afternoon: '下午',
    all_day: '全天'
  }[slot];
}

function statusText(status) {
  return {
    reserved: '已预约',
    checked_in: '已核销',
    cancelled: '已取消',
    expired: '已过期',
    violation: '违约'
  }[status];
}

function statusTagType(status) {
  return {
    reserved: 'primary',
    checked_in: 'success',
    cancelled: 'info',
    expired: 'warning',
    violation: 'danger'
  }[status];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getMyReservations(query);
    reservations.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
    listLoaded.value = true;
  }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确定取消该预约吗？', '提示', { type: 'warning' });
    await cancelReservation(row.id);
    ElMessage.success('取消成功');
    await loadData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '取消失败');
    }
  }
}

async function handleCheckin(row) {
  try {
    await ElMessageBox.confirm('确认核销该预约吗？', '提示', { type: 'info' });
    await checkinReservation(row.id, { method: 'qrcode' });
    ElMessage.success('核销成功');
    await loadData();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '核销失败');
    }
  }
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.page-container {
  background: var(--color-bg-card);
  padding: 24px;
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-card);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
