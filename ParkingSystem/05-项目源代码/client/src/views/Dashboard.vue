<template>
  <div class="page-container">
    <div class="page-header">
      <h2>数据看板</h2>
    </div>

    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <stat-card :value="overview.totalSpots" label="总车位" />
      </el-col>
      <el-col :span="6">
        <stat-card :value="overview.todayReservations" label="今日预约" />
      </el-col>
      <el-col :span="6">
        <stat-card :value="overview.activeReservations" label="有效预约" />
      </el-col>
      <el-col :span="6">
        <stat-card :value="overview.todayCheckedIn" label="今日核销" />
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card title="各区域使用率">
          <area-chart :data="areaData" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="近 7 日预约趋势">
          <time-trend-chart :data="trendData" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="quick-entry" title="快捷入口">
      <el-space wrap>
        <el-button type="primary" @click="$router.push('/parking-map')">车位地图</el-button>
        <el-button @click="$router.push('/my-reservations')">我的预约</el-button>
        <el-button @click="$router.push('/my-vehicles')">我的车辆</el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import StatCard from '@/components/StatCard.vue';
import AreaChart from '@/components/AreaChart.vue';
import TimeTrendChart from '@/components/TimeTrendChart.vue';
import { getOverview, getAreaUtilization, getTimeTrend } from '@/api/stats';

const overview = reactive({
  totalSpots: 0,
  todayReservations: 0,
  activeReservations: 0,
  todayCheckedIn: 0
});
const areaData = ref([]);
const trendData = ref([]);

async function loadData() {
  try {
    const today = dayjs().format('YYYY-MM-DD');
    const [overviewRes, areaRes, trendRes] = await Promise.all([
      getOverview(),
      getAreaUtilization({ date: today }),
      getTimeTrend({ days: 7 })
    ]);

    Object.assign(overview, overviewRes.data);
    areaData.value = areaRes.data || [];
    trendData.value = trendRes.data || [];
  } catch (err) {
    ElMessage.error(err.message || '加载数据失败');
  }
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.page-container {
  background: transparent;
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.quick-entry {
  background: #fff;
}
</style>
