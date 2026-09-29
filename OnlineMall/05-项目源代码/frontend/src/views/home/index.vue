<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import VChart from 'vue-echarts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import img_home_order from '@/assets/images/home_order.png'
import img_home_today_amount from '@/assets/images/home_today_amount.png'
import img_home_yesterday_amount from '@/assets/images/home_yesterday_amount.png'
import {
  fetchOverviewAPI,
  fetchSalesByTimeAPI,
  fetchSalesByProductAPI,
  exportStatisticsAPI,
  type StatisticsOverviewItem,
  type StatisticsSalesItem,
  type StatisticsProductItem
} from '@/apis/statistics'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const router = useRouter()
const userStore = useUserStore()
const themeStore = useThemeStore()

// 暗色模式下图表主题切换
const isDark = computed(() => themeStore.theme === 'dark')

// 按时段生成问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})
const username = computed(() => userStore.userInfo.username || '管理员')

const overview = ref<StatisticsOverviewItem | null>(null)
const salesData = ref<StatisticsSalesItem[]>([])
const productData = ref<StatisticsProductItem[]>([])
const loading = ref(false)

// 日期选择器（默认近30天）
const datePickerRange = ref<Date[]>([])

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initDatePickerRange = () => {
  const end = new Date()
  const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000)
  datePickerRange.value = [start, end]
}

const buildRangeParams = () => {
  const params: { startTime?: string; endTime?: string; groupBy: string } = { groupBy: 'day' }
  const [start, end] = datePickerRange.value || []
  if (start && end) {
    params.startTime = formatDate(start) + ' 00:00:00'
    params.endTime = formatDate(end) + ' 23:59:59'
  }
  return params
}

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000)
      return [start, end]
    }
  }
]

const fetchOverview = async () => {
  try {
    const res = await fetchOverviewAPI()
    overview.value = (res as any).data
  } catch (error) {
    ElMessage.error('加载总览数据失败')
  }
}

const fetchChartData = async () => {
  loading.value = true
  try {
    const res = await fetchSalesByTimeAPI(buildRangeParams())
    salesData.value = (res as any).data || []
  } catch (error) {
    ElMessage.error('加载订单统计失败')
  } finally {
    loading.value = false
  }
}

const fetchProductRank = async () => {
  try {
    const res = await fetchSalesByProductAPI({})
    productData.value = ((res as any).data || []).slice(0, 10)
  } catch (error) {
    ElMessage.error('加载商品销量排行失败')
  }
}

const handleDatePickerRangeChange = () => {
  fetchChartData()
}

// 导出
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

const exportReport = async (format: 'excel' | 'csv') => {
  try {
    const res = await exportStatisticsAPI({ ...buildRangeParams(), dimension: 'time', format })
    const type = format === 'excel'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv;charset=utf-8'
    const blob = new Blob([(res as any).data], { type })
    downloadBlob(blob, `statistics_time_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`)
  } catch (error) {
    ElMessage.error(`导出 ${format === 'excel' ? 'Excel' : 'CSV'} 失败`)
  }
}

// 环比计算：(current - last) / last * 100
const trendOf = (current?: number, last?: number) => {
  const c = Number(current || 0)
  const l = Number(last || 0)
  if (l === 0) {
    return c > 0 ? 100 : 0
  }
  return Number((((c - l) / l) * 100).toFixed(1))
}

const chartOption = computed(() => {
  const dimensions = salesData.value.map(item => item.dimension)
  const orderCounts = salesData.value.map(item => item.orderCount)
  const salesAmounts = salesData.value.map(item => item.salesAmount)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: { data: ['订单数量', '订单金额'] },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dimensions
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '订单金额',
        position: 'right'
      }
    ],
    series: [
      {
        name: '订单数量',
        type: 'line',
        areaStyle: {},
        data: orderCounts,
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '订单金额',
        type: 'line',
        yAxisIndex: 1,
        areaStyle: {},
        data: salesAmounts,
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
})

const goOrderList = () => router.push('/oms/order')
const goReturnApply = () => router.push('/oms/returnApply')
const goProductList = () => router.push('/pms/product')

onMounted(() => {
  initDatePickerRange()
  fetchOverview()
  fetchChartData()
  fetchProductRank()
})
</script>

<template>
  <div class="app-container">
    <!-- 问候语 -->
    <div class="greeting-banner">
      <div class="greeting-text">{{ greeting }}，{{ username }}</div>
      <div class="greeting-sub">欢迎使用在线商城管理后台，祝您工作顺利</div>
    </div>

    <!-- 核心指标 -->
    <div class="total-layout">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="total-frame">
            <img :src="img_home_order" class="total-icon">
            <div class="total-title">今日订单总数</div>
            <div class="total-value">{{ overview?.todayOrderCount ?? 0 }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="total-frame">
            <img :src="img_home_today_amount" class="total-icon">
            <div class="total-title">今日销售总额</div>
            <div class="total-value">￥{{ Number(overview?.todaySales || 0).toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="total-frame">
            <img :src="img_home_yesterday_amount" class="total-icon">
            <div class="total-title">昨日销售总额</div>
            <div class="total-value">￥{{ Number(overview?.yesterdaySales || 0).toFixed(2) }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 待处理事务 -->
    <div class="un-handle-layout">
      <div class="layout-title">待处理事务</div>
      <div class="un-handle-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="un-handle-item" @click="goOrderList">
              <span class="font-medium">待支付订单</span>
              <span class="color-danger un-handle-count">{{ overview?.pendingPaymentCount ?? 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item" @click="goOrderList">
              <span class="font-medium">待发货订单</span>
              <span class="color-danger un-handle-count">{{ overview?.pendingShipmentCount ?? 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item" @click="goReturnApply">
              <span class="font-medium">待处理售后申请</span>
              <span class="color-danger un-handle-count">{{ overview?.pendingReturnApplyCount ?? 0 }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="un-handle-item" @click="goOrderList">
              <span class="font-medium">已发货待收货</span>
              <span class="color-danger un-handle-count">{{ overview?.shippedCount ?? 0 }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="un-handle-item" @click="goProductList">
              <span class="font-medium">库存预警商品</span>
              <span class="color-danger un-handle-count">{{ overview?.lowStockCount ?? 0 }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 商品与用户总览 -->
    <div class="overview-layout">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="out-border">
            <div class="layout-title">商品总览</div>
            <div class="overview-content">
              <el-row>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.productOffCount ?? 0 }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.productOnCount ?? 0 }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.lowStockCount ?? 0 }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.productTotalCount ?? 0 }}</el-col>
              </el-row>
              <el-row class="font-medium">
                <el-col :span="6" class="overview-item-title">已下架</el-col>
                <el-col :span="6" class="overview-item-title">已上架</el-col>
                <el-col :span="6" class="overview-item-title">库存预警</el-col>
                <el-col :span="6" class="overview-item-title">全部商品</el-col>
              </el-row>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="out-border">
            <div class="layout-title">用户总览</div>
            <div class="overview-content">
              <el-row>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.memberTodayCount ?? 0 }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.memberYesterdayCount ?? 0 }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.memberMonthCount ?? 0 }}</el-col>
                <el-col :span="6" class="color-danger overview-item-value">{{ overview?.memberTotalCount ?? 0 }}</el-col>
              </el-row>
              <el-row class="font-medium">
                <el-col :span="6" class="overview-item-title">今日新增</el-col>
                <el-col :span="6" class="overview-item-title">昨日新增</el-col>
                <el-col :span="6" class="overview-item-title">本月新增</el-col>
                <el-col :span="6" class="overview-item-title">会员总数</el-col>
              </el-row>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 订单统计 -->
    <div class="statistics-layout">
      <div class="layout-title">
        订单统计
        <div class="export-buttons">
          <el-button size="small" @click="exportReport('excel')">导出 Excel</el-button>
          <el-button size="small" @click="exportReport('csv')">导出 CSV</el-button>
        </div>
      </div>
      <el-row>
        <el-col :span="4">
          <div class="statistics-summary">
            <div class="summary-item">
              <div class="summary-label">本月订单总数</div>
              <div class="summary-value">{{ overview?.monthOrderCount ?? 0 }}</div>
              <div class="summary-trend">
                <span :class="trendOf(overview?.monthOrderCount, overview?.lastMonthOrderCount) >= 0 ? 'color-success' : 'color-danger'">
                  {{ trendOf(overview?.monthOrderCount, overview?.lastMonthOrderCount) >= 0 ? '+' : '' }}{{ trendOf(overview?.monthOrderCount, overview?.lastMonthOrderCount) }}%
                </span>
                <span class="summary-compare">同比上月</span>
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">本周订单总数</div>
              <div class="summary-value">{{ overview?.weekOrderCount ?? 0 }}</div>
              <div class="summary-trend">
                <span :class="trendOf(overview?.weekOrderCount, overview?.lastWeekOrderCount) >= 0 ? 'color-success' : 'color-danger'">
                  {{ trendOf(overview?.weekOrderCount, overview?.lastWeekOrderCount) >= 0 ? '+' : '' }}{{ trendOf(overview?.weekOrderCount, overview?.lastWeekOrderCount) }}%
                </span>
                <span class="summary-compare">同比上周</span>
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">本月销售总额</div>
              <div class="summary-value">{{ Number(overview?.monthSales || 0).toFixed(2) }}</div>
              <div class="summary-trend">
                <span :class="trendOf(overview?.monthSales, overview?.lastMonthSales) >= 0 ? 'color-success' : 'color-danger'">
                  {{ trendOf(overview?.monthSales, overview?.lastMonthSales) >= 0 ? '+' : '' }}{{ trendOf(overview?.monthSales, overview?.lastMonthSales) }}%
                </span>
                <span class="summary-compare">同比上月</span>
              </div>
            </div>
            <div class="summary-item">
              <div class="summary-label">本周销售总额</div>
              <div class="summary-value">{{ Number(overview?.weekSales || 0).toFixed(2) }}</div>
              <div class="summary-trend">
                <span :class="trendOf(overview?.weekSales, overview?.lastWeekSales) >= 0 ? 'color-success' : 'color-danger'">
                  {{ trendOf(overview?.weekSales, overview?.lastWeekSales) >= 0 ? '+' : '' }}{{ trendOf(overview?.weekSales, overview?.lastWeekSales) }}%
                </span>
                <span class="summary-compare">同比上周</span>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="20">
          <div class="statistics-chart">
            <el-date-picker class="chart-date-picker" size="small" v-model="datePickerRange" type="daterange"
              align="right" unlink-panels range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
              :shortcuts="shortcuts" @change="handleDatePickerRangeChange">
            </el-date-picker>
            <div class="chart-container">
              <v-chart v-if="!loading" :option="chartOption" :theme="isDark ? 'dark' : ''" autoresize />
              <div v-else class="chart-loading">
                <el-skeleton :rows="5" animated />
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 商品销量排行 -->
    <div class="statistics-layout rank-layout">
      <div class="layout-title">商品销量排行（Top 10）</div>
      <el-table :data="productData" border style="width: 100%">
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column prop="productName" label="商品名称" show-overflow-tooltip />
        <el-table-column prop="saleCount" label="销量" width="120" />
        <el-table-column prop="salesAmount" label="销售额" width="140" />
        <el-table-column prop="refundRate" label="退款率" width="120">
          <template #default="scope">
            {{ Number(scope.row.refundRate || 0).toFixed(2) }}%
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  margin-top: 40px;
  margin-left: 120px;
  margin-right: 120px;
}

.greeting-banner {
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-end));
  border-radius: var(--radius-base);
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-card);
}

.greeting-text {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.greeting-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 6px;
}

.total-layout {
  margin-bottom: 20px;
}

.total-frame {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  padding: 20px;
  height: 100px;
}

.total-frame:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.total-icon {
  width: 60px;
  height: 60px;
}

.total-title {
  position: relative;
  font-size: 16px;
  color: var(--color-text-placeholder);
  left: 70px;
  top: -50px;
}

.total-value {
  position: relative;
  font-size: 18px;
  color: var(--color-text-secondary);
  left: 70px;
  top: -40px;
}

.un-handle-layout {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-bottom: 20px;
}

.layout-title {
  color: var(--color-text-secondary);
  padding: 15px 20px;
  background: var(--color-primary-light);
  font-weight: bold;
}

.un-handle-content {
  padding: 20px 40px;
}

.un-handle-item {
  border-bottom: 1px solid var(--color-border-lighter);
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.un-handle-item:hover {
  background: var(--color-bg-base);
}

.un-handle-count {
  font-size: 14px;
}

.overview-layout {
  margin-bottom: 20px;
}

.overview-content {
  padding: 40px;
}

.overview-item-value {
  font-size: 24px;
  text-align: center;
}

.overview-item-title {
  margin-top: 10px;
  text-align: center;
}

.out-border {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.statistics-layout {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.statistics-layout .layout-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.statistics-summary {
  padding: 20px;
}

.summary-item {
  margin-bottom: 20px;
}

.summary-label {
  color: var(--color-text-placeholder);
  font-size: 14px;
}

.summary-value {
  color: var(--color-text-secondary);
  font-size: 24px;
  padding: 10px 0;
}

.summary-compare {
  color: var(--color-text-placeholder);
  font-size: 14px;
  margin-left: 5px;
}

.statistics-chart {
  padding: 10px;
  border-left: 1px solid var(--color-border);
}

.chart-date-picker {
  float: right;
  z-index: 1;
}

.chart-container {
  height: 400px;
}

.chart-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.rank-layout {
  margin-top: 20px;
}
</style>
