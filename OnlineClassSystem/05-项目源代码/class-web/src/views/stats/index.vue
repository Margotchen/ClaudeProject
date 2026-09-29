<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">学习统计</div>
      <div class="page-desc">学习进度跟踪与多维度统计分析</div>
    </div>

    <!-- 学生视角 -->
    <template v-if="isStudent">
      <div class="stat-cards">
        <BaseCard class="stat-card">
          <div class="stat-value">{{ formatDuration(my.totalSeconds) }}</div>
          <div class="stat-label">总学习时长</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ my.homeworkRate }}%</div>
          <div class="stat-label">作业完成率</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ my.examAvg ?? '-' }}</div>
          <div class="stat-label">考试平均分</div>
        </BaseCard>
      </div>
      <BaseCard>
        <template #header>各课程学习进度</template>
        <el-skeleton v-if="loading && !(my.courses || []).length" :rows="5" animated />
        <el-table v-else :data="my.courses || []" v-loading="loading">
          <template #empty><el-empty description="暂无学习记录" :image-size="80" /></template>
          <el-table-column prop="courseName" label="课程名称" min-width="160" />
          <el-table-column label="直播时长" width="120" align="center">
            <template #default="{ row }">{{ formatDuration(row.liveSeconds) }}</template>
          </el-table-column>
          <el-table-column label="录播时长" width="120" align="center">
            <template #default="{ row }">{{ formatDuration(row.playbackSeconds) }}</template>
          </el-table-column>
          <el-table-column label="作业" width="110" align="center">
            <template #default="{ row }">{{ row.homeworkSubmitted }}/{{ row.homeworkTotal }}</template>
          </el-table-column>
          <el-table-column label="考试均分" width="100" align="center">
            <template #default="{ row }">{{ row.examAvg ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="最近学习" width="170" align="center">
            <template #default="{ row }">{{ formatTime(row.lastStudyTime) }}</template>
          </el-table-column>
        </el-table>
      </BaseCard>
    </template>

    <!-- 管理/讲师/班主任视角 -->
    <template v-else>
      <div class="stat-cards">
        <BaseCard class="stat-card">
          <div class="stat-value">{{ overview.courseCount ?? 0 }}</div>
          <div class="stat-label">课程总数</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ overview.studentCount ?? 0 }}</div>
          <div class="stat-label">参与学生</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ formatDuration(overview.totalSeconds) }}</div>
          <div class="stat-label">总学习时长</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ overview.homeworkRate ?? 0 }}%</div>
          <div class="stat-label">作业提交率</div>
        </BaseCard>
        <BaseCard class="stat-card">
          <div class="stat-value">{{ overview.examAvg ?? '-' }}</div>
          <div class="stat-label">考试平均分</div>
        </BaseCard>
      </div>

      <div class="chart-row">
        <BaseCard class="chart-card">
          <template #header>各课程学习时长</template>
          <div ref="barChartRef" class="chart-box" v-loading="loading" />
        </BaseCard>
        <BaseCard class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>成绩分布</span>
              <el-select v-model="distributionCourseId" size="small" style="width: 200px"
                         @change="loadDistribution">
                <el-option v-for="c in courseList" :key="c.courseId" :label="c.courseName"
                           :value="c.courseId" />
              </el-select>
            </div>
          </template>
          <div ref="pieChartRef" class="chart-box" v-loading="loading" />
        </BaseCard>
      </div>

      <BaseCard>
        <template #header>
          <div class="chart-header">
            <el-tabs v-model="activeTab" class="stats-tabs">
              <el-tab-pane label="课程维度" name="course" />
              <el-tab-pane label="学生维度" name="student" />
            </el-tabs>
            <el-dropdown @command="handleExport">
              <el-button type="primary" size="small">导出报表</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
                  <el-dropdown-item command="csv">导出 CSV</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>

        <el-skeleton v-if="loading && activeTab === 'course' && !courseList.length" :rows="5" animated />
        <el-table v-else-if="activeTab === 'course'" :data="courseList" v-loading="loading">
          <template #empty><el-empty description="暂无课程数据" :image-size="80" /></template>
          <el-table-column prop="courseName" label="课程名称" min-width="150" />
          <el-table-column prop="teacherName" label="讲师" width="110" />
          <el-table-column label="学习总时长" width="120" align="center">
            <template #default="{ row }">{{ formatDuration(row.totalSeconds) }}</template>
          </el-table-column>
          <el-table-column prop="studentCount" label="参与学生" width="100" align="center" />
          <el-table-column label="作业提交" width="110" align="center">
            <template #default="{ row }">{{ row.homeworkSubmitted }}/{{ row.homeworkTotal }}</template>
          </el-table-column>
          <el-table-column label="考试均分" width="100" align="center">
            <template #default="{ row }">{{ row.examAvg ?? '-' }}</template>
          </el-table-column>
        </el-table>

        <el-skeleton v-else-if="loading && !studentList.length" :rows="5" animated />
        <el-table v-else :data="studentList" v-loading="loading">
          <template #empty><el-empty description="暂无学生数据" :image-size="80" /></template>
          <el-table-column prop="studentName" label="学生" min-width="120" />
          <el-table-column label="学习总时长" width="130" align="center">
            <template #default="{ row }">{{ formatDuration(row.totalSeconds) }}</template>
          </el-table-column>
          <el-table-column prop="homeworkSubmitted" label="作业提交数" width="110" align="center" />
          <el-table-column label="作业完成率" width="120" align="center">
            <template #default="{ row }">
              <el-progress :percentage="row.homeworkRate" :stroke-width="8" />
            </template>
          </el-table-column>
          <el-table-column label="考试均分" width="100" align="center">
            <template #default="{ row }">{{ row.examAvg ?? '-' }}</template>
          </el-table-column>
          <el-table-column label="最近学习" width="170" align="center">
            <template #default="{ row }">{{ formatTime(row.lastStudyTime) }}</template>
          </el-table-column>
        </el-table>
      </BaseCard>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import BaseCard from '../../components/BaseCard.vue'
import { useUserStore } from '../../store/user'
import { useThemeStore } from '../../store/theme'
import {
  myProgress, statsOverview, courseStats, scoreDistribution, studentStats, statsExportUrl
} from '../../api/stats'

const userStore = useUserStore()
const themeStore = useThemeStore()
const isStudent = computed(() => userStore.roleCode === 'STUDENT')

const loading = ref(false)
const my = ref({})
const overview = ref({})
const courseList = ref([])
const studentList = ref([])
const activeTab = ref('course')
const distributionCourseId = ref(null)

const barChartRef = ref(null)
const pieChartRef = ref(null)
let barChart = null
let pieChart = null

const formatDuration = (seconds) => {
  const s = seconds || 0
  if (s < 60) return `${s}秒`
  if (s < 3600) return `${Math.floor(s / 60)}分钟`
  return `${(s / 3600).toFixed(1)}小时`
}
const formatTime = (t) => (t ? t.replace('T', ' ').slice(0, 19) : '-')

// 从 CSS 变量读取主题色，保证双主题下图表配色一致
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const isDark = computed(() => themeStore.theme === 'dark')
const chartTheme = () => (isDark.value ? 'dark' : null)

const renderBar = () => {
  if (!barChartRef.value) return
  if (barChart) barChart.dispose()
  barChart = echarts.init(barChartRef.value, chartTheme(), { renderer: 'canvas' })
  barChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', formatter: (ps) => `${ps[0].name}<br/>学习时长：${formatDuration(ps[0].value)}` },
    grid: { left: 10, right: 10, top: 30, bottom: 10, containLabel: true },
    xAxis: { type: 'category', data: courseList.value.map(c => c.courseName), axisLabel: { interval: 0, rotate: courseList.value.length > 5 ? 30 : 0 } },
    yAxis: { type: 'value', axisLabel: { formatter: (v) => formatDuration(v) } },
    series: [{ type: 'bar', data: courseList.value.map(c => c.totalSeconds), itemStyle: { color: cssVar('--color-primary'), borderRadius: [4, 4, 0, 0] }, barMaxWidth: 48 }]
  })
}

const renderPie = (dist) => {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value, chartTheme(), { renderer: 'canvas' })
  const data = [
    { name: '优秀（≥80%）', value: dist.high, itemStyle: { color: cssVar('--color-success') } },
    { name: '及格（60~79%）', value: dist.mid, itemStyle: { color: cssVar('--color-warning') } },
    { name: '待提升（<60%）', value: dist.low, itemStyle: { color: cssVar('--color-danger') } }
  ]
  pieChart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: '{b}：{c}份（{d}%）' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'], data, label: { formatter: '{c}份' } }]
  }, true)
}

// 主题切换时重建图表（echarts 主题只能在 init 时指定）
watch(() => themeStore.theme, () => {
  if (!isStudent.value && courseList.value.length) {
    nextTick(() => {
      renderBar()
      loadDistribution()
    })
  }
})

const loadDistribution = async () => {
  if (!distributionCourseId.value) return
  const res = await scoreDistribution(distributionCourseId.value)
  renderPie(res)
}

const handleExport = (format) => {
  window.open(statsExportUrl(activeTab.value, format), '_blank')
}

const resizeCharts = () => {
  barChart?.resize()
  pieChart?.resize()
}

onMounted(async () => {
  loading.value = true
  try {
    if (isStudent.value) {
      const res = await myProgress()
      my.value = res
    } else {
      const [ov, cs] = await Promise.all([statsOverview(), courseStats()])
      overview.value = ov
      courseList.value = cs
      studentStats().then(res => { studentList.value = res })
      await nextTick()
      renderBar()
      if (courseList.value.length > 0) {
        distributionCourseId.value = courseList.value[0].courseId
        await loadDistribution()
      }
      window.addEventListener('resize', resizeCharts)
    }
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  barChart?.dispose()
  pieChart?.dispose()
})
</script>

<style lang="scss" scoped>
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 16px;

  .stat-card {
    text-align: center;

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--color-primary, #4080ff);
    }

    .stat-label {
      margin-top: 6px;
      font-size: 13px;
      color: var(--color-text-secondary, #4e5969);
    }
  }
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  .chart-box {
    height: 300px;
  }

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.stats-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}
</style>
