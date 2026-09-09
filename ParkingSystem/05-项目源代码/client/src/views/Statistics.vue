<template>
  <div class="page-container">
    <div class="page-header">
      <h2>统计报表</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          @change="loadData"
        />
        <el-button type="primary" @click="exportData">导出 CSV</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stats-cards">
      <el-col :span="6">
        <stat-card :value="overview.totalSpots" label="总车位" />
      </el-col>
      <el-col :span="6">
        <stat-card :value="overview.todayReservations" label="今日预约" />
      </el-col>
      <el-col :span="6">
        <stat-card :value="overview.utilizationRate + '%'" label="本周平均使用率" />
      </el-col>
      <el-col :span="6">
        <stat-card :value="overview.violationCount" label="本月违约" />
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

    <el-card class="detail-table" title="详细数据">
      <el-table :data="detailData" border
>
        <el-table-column prop="date" label="日期" />
        <el-table-column prop="area" label="区域" />
        <el-table-column prop="timeSlot" label="时段">
          <template #default="{ row }">{{ slotText(row.timeSlot) }}</template>
        </el-table-column>
        <el-table-column prop="total" label="总车位" />
        <el-table-column prop="used" label="已使用" />
        <el-table-column prop="rate" label="使用率(%)" />
      </el-table>
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
import { getOverview, getAreaUtilization, getTimeTrend, getDetailedStats, exportStatsCSV } from '@/api/stats';

const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const overview = reactive({
  totalSpots: 0,
  todayReservations: 0,
  utilizationRate: 0,
  violationCount: 0
});
const areaData = ref([]);
const trendData = ref([]);
const detailData = ref([]);

function slotText(slot) {
  return {
    morning: '上午',
    afternoon: '下午',
    all_day: '全天'
  }[slot];
}

async function loadData() {
  try {
    const [overviewRes, areaRes, trendRes, detailRes] = await Promise.all([
      getOverview(),
      getAreaUtilization({ date: selectedDate.value }),
      getTimeTrend({ days: 7 }),
      getDetailedStats({ date: selectedDate.value })
    ]);

    Object.assign(overview, overviewRes.data);
    areaData.value = areaRes.data || [];
    trendData.value = trendRes.data || [];
    detailData.value = detailRes.data || [];
  } catch (err) {
    ElMessage.error(err.message || '加载统计失败');
  }
}

async function exportData() {
  try {
    const blob = await exportStatsCSV({ date: selectedDate.value });
    const url = URL.createObjectURL(new Blob([blob]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `车位使用统计_${selectedDate.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    ElMessage.error(err.message || '导出失败');
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.stats-cards {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.detail-table {
  background: #fff;
}
</style>
