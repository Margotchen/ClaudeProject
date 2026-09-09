<template>
  <div class="page-container">
    <div class="page-header">
      <h2>车位地图</h2>
      <el-radio-group v-model="timeSlot" @change="loadData">
        <el-radio-button label="morning">上午 08:00-12:00</el-radio-button>
        <el-radio-button label="afternoon">下午 13:00-18:00</el-radio-button>
        <el-radio-button label="all_day">全天 08:00-18:00</el-radio-button>
      </el-radio-group>
    </div>

    <div class="filter-bar">
      <el-date-picker
        v-model="selectedDate"
        type="date"
        placeholder="选择预约日期"
        value-format="YYYY-MM-DD"
        :disabled-date="disabledDate"
        @change="loadData"
      />
      <span class="tips">点击绿色空闲车位即可预约</span>
    </div>

    <parking-lot-map
      :spots="spots"
      :areas="areas"
      @select="handleSpotSelect"
    />

    <!-- 预约弹窗 -->
    <el-dialog v-model="reserveDialogVisible" title="确认预约" width="450px">
      <div v-if="selectedSpot">
        <p><strong>车位：</strong>{{ selectedSpot.spot_code }}（{{ selectedSpot.area_name }}）</p>
        <p><strong>日期：</strong>{{ selectedDate }}</p>
        <p><strong>时段：</strong>{{ slotText(timeSlot) }}</p>
        <el-form :model="reserveForm" label-width="80px">
          <el-form-item label="选择车辆">
            <el-select v-model="reserveForm.vehicleId" placeholder="请选择车辆">
              <el-option
                v-for="v in vehicles"
                :key="v.id"
                :label="`${v.plate_number} ${v.car_type || ''}`"
                :value="v.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reserveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReserve" :loading="reserving">确认预约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import ParkingLotMap from '@/components/ParkingLotMap.vue';
import { getMapStatus, getAreas } from '@/api/spot';
import { getVehicles } from '@/api/vehicle';
import { createReservation } from '@/api/reservation';

const selectedDate = ref(dayjs().add(1, 'day').format('YYYY-MM-DD'));
const timeSlot = ref('all_day');
const spots = ref([]);
const areas = ref([]);
const vehicles = ref([]);
const reserveDialogVisible = ref(false);
const selectedSpot = ref(null);
const reserving = ref(false);

const reserveForm = reactive({
  vehicleId: ''
});

function disabledDate(date) {
  return dayjs(date).isBefore(dayjs().startOf('day'));
}

function slotText(slot) {
  return {
    morning: '上午 08:00-12:00',
    afternoon: '下午 13:00-18:00',
    all_day: '全天 08:00-18:00'
  }[slot];
}

async function loadAreas() {
  const res = await getAreas();
  areas.value = res.data || [];
}

async function loadVehicles() {
  const res = await getVehicles();
  vehicles.value = res.data || [];
  const defaultVehicle = vehicles.value.find(v => v.is_default);
  if (defaultVehicle) {
    reserveForm.vehicleId = defaultVehicle.id;
  } else if (vehicles.value.length > 0) {
    reserveForm.vehicleId = vehicles.value[0].id;
  }
}

async function loadData() {
  if (!selectedDate.value) return;
  try {
    const res = await getMapStatus({
      date: selectedDate.value,
      timeSlot: timeSlot.value
    });
    spots.value = res.data.list || [];
  } catch (err) {
    ElMessage.error(err.message || '加载车位地图失败');
  }
}

function handleSpotSelect(spot) {
  if (vehicles.value.length === 0) {
    ElMessage.warning('您还没有登记车辆，请先添加车辆');
    return;
  }
  selectedSpot.value = spot;
  reserveDialogVisible.value = true;
}

async function handleReserve() {
  if (!reserveForm.vehicleId) {
    ElMessage.warning('请选择车辆');
    return;
  }

  reserving.value = true;
  try {
    await createReservation({
      spotId: selectedSpot.value.id,
      vehicleId: reserveForm.vehicleId,
      reserveDate: selectedDate.value,
      timeSlot: timeSlot.value
    });
    ElMessage.success('预约成功');
    reserveDialogVisible.value = false;
    await loadData();
  } catch (err) {
    ElMessage.error(err.message || '预约失败');
  } finally {
    reserving.value = false;
  }
}

onMounted(async () => {
  await loadAreas();
  await loadVehicles();
  await loadData();
});
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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;

  .tips {
    color: #909399;
    font-size: 13px;
  }
}
</style>
