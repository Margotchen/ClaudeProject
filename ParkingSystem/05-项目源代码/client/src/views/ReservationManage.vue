<template>
  <div class="page-container">
    <div class="page-header">
      <h2>预约管理</h2>
    </div>

    <el-form :inline="true" :model="query" class="search-form">
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部状态" clearable @change="loadData">
          <el-option label="已预约" value="reserved" />
          <el-option label="已核销" value="checked_in" />
          <el-option label="已取消" value="cancelled" />
          <el-option label="违约" value="violation" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期">
        <el-date-picker
          v-model="query.date"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          clearable
          @change="loadData"
        />
      </el-form-item>
      <el-form-item>
        <el-input v-model="query.keyword" placeholder="单号/用户名/车位" clearable @keyup.enter="loadData" />
      </el-form-item>
      <el-form-item>
        <el-button @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="reservations" border v-loading="loading">
      <el-table-column prop="reservation_no" label="预约单号" />
      <el-table-column prop="real_name" label="预约人" />
      <el-table-column prop="spot_code" label="车位" />
      <el-table-column prop="area_name" label="区域" />
      <el-table-column prop="plate_number" label="车牌" />
      <el-table-column prop="reserve_date" label="日期" />
      <el-table-column prop="time_slot" label="时段">
        <template #default="{ row }">{{ slotText(row.time_slot) }}</template>
      </el-table-column>
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
import { getAllReservations, cancelReservation, checkinReservation } from '@/api/reservation';

const loading = ref(false);
const reservations = ref([]);
const total = ref(0);
const query = reactive({
  status: '',
  date: '',
  keyword: '',
  page: 1,
  pageSize: 20
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
    const res = await getAllReservations(query);
    reservations.value = res.data.list || [];
    total.value = res.data.total || 0;
  } finally {
    loading.value = false;
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
    await checkinReservation(row.id, { method: 'manual' });
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
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
