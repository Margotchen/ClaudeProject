<template>
  <div class="dashboard-page">
    <h2>数据看板</h2>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <el-statistic title="活动总数" :value="stats.totalActivities" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="进行中活动" :value="stats.ongoingActivities" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="累计申领人次" :value="stats.totalApplyCount" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="待发货数量" :value="stats.pendingDeliverCount" />
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card title="礼品申领排行 Top10">
          <div ref="giftChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="部门参与率">
          <div ref="deptChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card title="发货进度统计" class="progress-card">
      <el-table :data="deliveryProgress" border
      >
        <el-table-column prop="activity_name" label="活动名称" />
        <el-table-column prop="pending" label="待发货" />
        <el-table-column prop="delivered" label="已发货" />
        <el-table-column prop="signed" label="已签收" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getDashboard } from '@/api/statistics'

const stats = ref({
  totalActivities: 0,
  ongoingActivities: 0,
  totalApplyCount: 0,
  pendingDeliverCount: 0
})
const topGifts = ref([])
const departments = ref([])
const deliveryProgress = ref([])

const giftChartRef = ref()
const deptChartRef = ref()

onMounted(async () => {
  try {
    const res = await getDashboard()
    stats.value = res.data.stats
    topGifts.value = res.data.topGifts
    departments.value = res.data.departments
    deliveryProgress.value = res.data.deliveryProgress

    await nextTick()
    renderGiftChart()
    renderDeptChart()
  } catch {
    ElMessage.error('获取统计数据失败')
  }
})

const renderGiftChart = () => {
  const chart = echarts.init(giftChartRef.value)
  const option = {
    xAxis: { type: 'category', data: topGifts.value.map(g => g.gift_name), axisLabel: { rotate: 30 } },
    yAxis: { type: 'value' },
    series: [{
      data: topGifts.value.map(g => g.total_quantity),
      type: 'bar',
      itemStyle: { color: '#409EFF' }
    }],
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true }
  }
  chart.setOption(option)
}

const renderDeptChart = () => {
  const chart = echarts.init(deptChartRef.value)
  const option = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: departments.value.map(d => ({ value: d.apply_users, name: d.department }))
    }]
  }
  chart.setOption(option)
}
</script>

<style scoped>
.dashboard-page h2 {
  margin-bottom: 20px;
}

.stat-row .el-col {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
}

.progress-card {
  margin-top: 20px;
}
</style>
