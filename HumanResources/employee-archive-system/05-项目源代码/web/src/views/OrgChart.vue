<template>
  <div class="page">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card title="部门人员分布">
          <v-chart class="chart" :option="deptOption" :theme="chartTheme" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="岗位分布">
          <v-chart class="chart" :option="positionOption" :theme="chartTheme" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card title="司龄分布">
          <v-chart class="chart" :option="seniorityOption" :theme="chartTheme" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="部门下钻">
          <el-select v-model="selectedDept" placeholder="选择部门" @change="fetchDeptEmployees" style="width: 100%; margin-bottom: 12px">
            <el-option v-for="d in departments" :key="d" :label="d" :value="d" />
          </el-select>
          <el-table :data="deptEmployees" stripe border height="300">
            <el-table-column prop="employee_no" label="工号" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="position" label="岗位" />
            <el-table-column prop="entry_date" label="入职日期" />
            <template #empty>
              <el-empty description="请选择部门查看人员" :image-size="80" />
            </template>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import request from '../api/request.js';
import { themeState } from '../utils/theme';

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent]);

// ECharts 暗色主题跟随全局主题（内置 dark 主题 + 透明背景融入卡片）
const chartTheme = computed(() => (themeState.theme === 'dark' ? 'dark' : undefined));

const deptData = ref([]);
const positionData = ref([]);
const seniorityData = ref([]);
const departments = ref([]);
const selectedDept = ref('');
const deptEmployees = ref([]);

const deptOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: deptData.value.map(d => d.department), axisLabel: { rotate: 30 } },
  yAxis: { type: 'value' },
  series: [{
    data: deptData.value.map(d => d.count),
    type: 'bar',
    itemStyle: { color: '#409EFF' }
  }]
}));

const positionOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { top: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: positionData.value.map(d => ({ value: d.count, name: d.position }))
  }]
}));

const seniorityOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: seniorityData.value.map(d => d.name) },
  yAxis: { type: 'value' },
  series: [{
    data: seniorityData.value.map(d => d.count),
    type: 'bar',
    itemStyle: { color: '#67C23A' }
  }]
}));

async function fetchStats() {
  const [deptRes, posRes, senRes] = await Promise.all([
    request.get('/stats/department'),
    request.get('/stats/position'),
    request.get('/stats/seniority')
  ]);
  deptData.value = deptRes.data;
  positionData.value = posRes.data;
  seniorityData.value = senRes.data;
  departments.value = deptRes.data.map(d => d.department);
  if (departments.value.length) {
    selectedDept.value = departments.value[0];
    fetchDeptEmployees();
  }
}

async function fetchDeptEmployees() {
  if (!selectedDept.value) return;
  const res = await request.get(`/stats/department/${encodeURIComponent(selectedDept.value)}/employees`);
  deptEmployees.value = res.data;
}

onMounted(fetchStats);
</script>

<style scoped>
.page {
  min-height: calc(100vh - 140px);
}
.chart {
  height: 350px;
}
.chart-row {
  margin-top: 20px;
}
</style>
