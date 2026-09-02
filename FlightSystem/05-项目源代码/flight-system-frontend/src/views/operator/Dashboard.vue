<template>
  <div class="dashboard">
    <h1>Dashboard</h1>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card>
          <div class="stat-label">Today's Flights</div>
          <div class="stat-value">{{ stats.todayFlightCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">Today's Orders</div>
          <div class="stat-value">{{ stats.todayOrderCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">Today's Revenue</div>
          <div class="stat-value">¥{{ stats.todayRevenue }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-label">Pending Refunds</div>
          <div class="stat-value">{{ stats.pendingRefundCount }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="export-card">
      <template #header>
        <span>Data Export</span>
      </template>
      <div class="export-actions">
        <el-button type="primary" @click="exportData('orders', 'xlsx')">Export Orders (Excel)</el-button>
        <el-button @click="exportData('orders', 'csv')">Export Orders (CSV)</el-button>
        <el-button type="primary" @click="exportData('flights', 'xlsx')">Export Flights (Excel)</el-button>
        <el-button @click="exportData('flights', 'csv')">Export Flights (CSV)</el-button>
      </div>
    </el-card>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>7-Day Order Trend</span>
          </template>
          <div ref="trendChart" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>Cabin Sales</span>
          </template>
          <div ref="cabinChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>Top 5 Routes</span>
          </template>
          <div ref="routeChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getDashboard } from '@/api/statistics'
import { exportOrders, exportFlights } from '@/api/export'

const stats = ref({
  todayFlightCount: 0,
  todayOrderCount: 0,
  todayRevenue: 0,
  pendingRefundCount: 0,
  trend: [],
  cabinSales: [],
  topRoutes: []
})

const trendChart = ref(null)
const cabinChart = ref(null)
const routeChart = ref(null)

const loadDashboard = async () => {
  try {
    const res = await getDashboard()
    stats.value = res.data
    nextTick(() => renderCharts())
  } catch (err) {
    console.error(err)
  }
}

const renderCharts = () => {
  if (trendChart.value) {
    const chart = echarts.init(trendChart.value)
    chart.setOption({
      xAxis: { type: 'category', data: stats.value.trend.map(d => d.date) },
      yAxis: { type: 'value' },
      series: [{ data: stats.value.trend.map(d => d.count), type: 'line', smooth: true }]
    })
  }

  if (cabinChart.value) {
    const chart = echarts.init(cabinChart.value)
    chart.setOption({
      series: [{
        type: 'pie',
        data: stats.value.cabinSales.map(c => ({ name: capitalize(c.cabinClass), value: c.count }))
      }]
    })
  }

  if (routeChart.value) {
    const chart = echarts.init(routeChart.value)
    chart.setOption({
      xAxis: { type: 'category', data: stats.value.topRoutes.map(r => r.route) },
      yAxis: { type: 'value' },
      series: [{ data: stats.value.topRoutes.map(r => r.count), type: 'bar' }]
    })
  }
}

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const exportData = async (type, format) => {
  try {
    let res
    let filename
    if (type === 'orders') {
      res = await exportOrders(format)
      filename = `orders.${format}`
    } else {
      res = await exportFlights(format)
      filename = `flights.${format}`
    }
    const blob = new Blob([res.data], { type: format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    ElMessage.error('Export failed')
    console.error(err)
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  color: #303133;
  font-size: 28px;
  font-weight: bold;
}

.export-card {
  margin-bottom: 20px;
}

.export-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.charts-row {
  margin-bottom: 20px;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>
