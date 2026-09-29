<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ greeting }}，{{ userStore.userInfo.realName || '同事' }}</h2>
      <p class="page-desc">欢迎使用停车位预约管理系统</p>
    </div>

    <el-skeleton v-if="!loaded" :rows="6" animated />
    <template v-else>
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
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import dayjs from 'dayjs';
import StatCard from '@/components/StatCard.vue';
import AreaChart from '@/components/AreaChart.vue';
import TimeTrendChart from '@/components/TimeTrendChart.vue';
import { getOverview, getAreaUtilization, getTimeTrend } from '@/api/stats';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const loaded = ref(false);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

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
  } finally {
    loaded.value = true;
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
  background: var(--color-bg-card);
}

.page-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
