<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import VChart from 'vue-echarts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
} from 'echarts/components'
import {
  fetchSalesByTimeAPI,
  fetchSalesByProductAPI,
  fetchSalesByCategoryAPI,
  exportSalesExcelAPI,
  exportSalesCsvAPI,
  type StatisticsSalesItem,
  type StatisticsProductItem,
  type StatisticsCategoryItem,
} from '@/apis/statistics'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
])

const dateRange = ref<Date[]>([])
const groupBy = ref('day')
const productId = ref<string>('')
const categoryId = ref<string>('')

const salesData = ref<StatisticsSalesItem[]>([])
const productData = ref<StatisticsProductItem[]>([])
const categoryData = ref<StatisticsCategoryItem[]>([])
const loading = ref(false)

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initDateRange = () => {
  const end = new Date()
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
  dateRange.value = [start, end]
}

const buildParams = () => {
  const params: any = { groupBy: groupBy.value }
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    params.startTime = formatDate(dateRange.value[0]) + ' 00:00:00'
    params.endTime = formatDate(dateRange.value[1]) + ' 23:59:59'
  }
  if (productId.value) {
    params.productId = Number(productId.value)
  }
  if (categoryId.value) {
    params.categoryId = Number(categoryId.value)
  }
  return params
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = buildParams()
    const [salesRes, productRes, categoryRes] = await Promise.all([
      fetchSalesByTimeAPI(params),
      fetchSalesByProductAPI(params),
      fetchSalesByCategoryAPI(params),
    ])
    salesData.value = (salesRes as any).data || []
    productData.value = (productRes as any).data || []
    categoryData.value = (categoryRes as any).data || []
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const exportExcel = async () => {
  try {
    const res = await exportSalesExcelAPI(buildParams())
    const blob = new Blob([res as any], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    downloadBlob(blob, `sales_${Date.now()}.xlsx`)
  } catch (error) {
    ElMessage.error('导出 Excel 失败')
  }
}

const exportCsv = async () => {
  try {
    const res = await exportSalesCsvAPI(buildParams())
    const blob = new Blob([res as any], { type: 'text/csv;charset=utf-8' })
    downloadBlob(blob, `sales_${Date.now()}.csv`)
  } catch (error) {
    ElMessage.error('导出 CSV 失败')
  }
}

onMounted(() => {
  initDateRange()
  fetchData()
})

const lineChartOption = computed(() => {
  const dimensions = salesData.value.map(item => item.dimension)
  const orderCounts = salesData.value.map(item => item.orderCount)
  const salesAmounts = salesData.value.map(item => item.salesAmount)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '销售额'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dimensions },
    yAxis: [
      { type: 'value', name: '订单量', position: 'left' },
      { type: 'value', name: '销售额', position: 'right' },
    ],
    series: [
      {
        name: '订单量',
        type: 'line',
        data: orderCounts,
        smooth: true,
        itemStyle: { color: '#409EFF' },
      },
      {
        name: '销售额',
        type: 'line',
        yAxisIndex: 1,
        data: salesAmounts,
        smooth: true,
        itemStyle: { color: '#67C23A' },
      },
    ],
  }
})

const pieChartOption = computed(() => {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '类目销售占比',
        type: 'pie',
        radius: '50%',
        data: categoryData.value.map(item => ({
          name: item.categoryName,
          value: Number(item.salesAmount),
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="app-container">
    <el-card class="filter-container" shadow="never">
      <div>
        <i class="el-icon-search" />
        <span>筛选搜索</span>
        <el-button style="float: right" type="primary" size="small" @click="fetchData">
          查询
        </el-button>
        <el-button style="float: right; margin-right: 10px" size="small" @click="exportExcel">
          导出 Excel
        </el-button>
        <el-button style="float: right; margin-right: 10px" size="small" @click="exportCsv">
          导出 CSV
        </el-button>
      </div>
      <div style="margin-top: 15px">
        <el-form :inline="true" size="small" label-width="100px">
          <el-form-item label="时间范围：">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="时间粒度：">
            <el-select v-model="groupBy" placeholder="请选择" style="width: 120px">
              <el-option label="按日" value="day" />
              <el-option label="按周" value="week" />
              <el-option label="按月" value="month" />
            </el-select>
          </el-form-item>
          <el-form-item label="商品ID：">
            <el-input v-model="productId" placeholder="商品ID" style="width: 120px" />
          </el-form-item>
          <el-form-item label="类目ID：">
            <el-input v-model="categoryId" placeholder="类目ID" style="width: 120px" />
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <div slot="header" class="clearfix">
            <span>销售趋势</span>
          </div>
          <v-chart class="chart" :option="lineChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <div slot="header" class="clearfix">
            <span>类目销售占比</span>
          </div>
          <v-chart class="chart" :option="pieChartOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <div slot="header" class="clearfix">
            <span>商品销量排行</span>
          </div>
          <el-table :data="productData" border style="width: 100%" v-loading="loading">
            <el-table-column prop="productId" label="商品ID" width="80" />
            <el-table-column prop="productName" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="saleCount" label="销量" width="90" />
            <el-table-column prop="salesAmount" label="销售额" width="110" />
            <el-table-column prop="refundRate" label="退款率" width="100">
              <template #default="scope">
                {{ (scope.row.refundRate * 100).toFixed(2) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.chart {
  height: 400px;
}
</style>
