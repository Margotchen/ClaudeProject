<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">我的课表</div>
      <div class="page-desc">查看直播课程安排，开播前请准时进入课堂</div>
    </div>

    <div class="toolbar">
      <el-select v-model="query.courseId" placeholder="按课程筛选" clearable style="width: 220px">
        <el-option v-for="c in courseOptions" :key="c.id" :label="c.courseName" :value="c.id" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 260px"
      />
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
    </div>

    <el-skeleton v-if="loading" :rows="4" animated />
    <template v-else>
      <el-empty v-if="!tableData.length" description="暂无课程安排" />
      <div v-else class="schedule-list">
        <BaseCard v-for="s in tableData" :key="s.id" class="schedule-card">
          <div class="schedule-body">
            <div class="time-block" :class="{ soon: isSoon(s) }">
              <div class="date">{{ formatDate(s.startTime) }}</div>
              <div class="time">{{ formatTime(s.startTime) }}</div>
              <el-tag v-if="isSoon(s)" type="danger" size="small" effect="dark">即将开播</el-tag>
            </div>
            <div class="info-block">
              <div class="title">{{ s.liveTitle }}</div>
              <div class="meta">
                <span><el-icon><Reading /></el-icon>{{ s.courseName }}</span>
                <span><el-icon><User /></el-icon>{{ s.teacherName }}</span>
                <span><el-icon><Timer /></el-icon>{{ s.duration }} 分钟</span>
              </div>
            </div>
            <div class="status-block">
              <el-tag :type="{ 0: 'info', 1: 'danger', 2: 'success' }[s.status]" size="large">
                {{ { 0: '未开始', 1: '直播中', 2: '已结束' }[s.status] }}
              </el-tag>
              <el-button v-if="s.status === 1" type="danger" size="small" style="margin-top: 8px" @click="enterRoom(s)">
                进入课堂
              </el-button>
            </div>
          </div>
        </BaseCard>
      </div>
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @change="loadData"
      />
    </template>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Reading, User, Timer } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pageSchedules } from '../../../api/live'
import { pageCourses } from '../../../api/course'

const router = useRouter()

function enterRoom(s) {
  router.push(`/live/room/${s.id}`)
}

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const courseOptions = ref([])
const dateRange = ref(null)
const query = reactive({ pageNum: 1, pageSize: 10, courseId: null, startDate: '', endDate: '' })

watch(dateRange, (val) => {
  query.startDate = val?.[0] || ''
  query.endDate = val?.[1] || ''
})

function formatDate(time) {
  return time?.slice(0, 10) || ''
}

function formatTime(time) {
  return time?.slice(11, 16) || ''
}

// 距开播不足 24 小时视为即将开播
function isSoon(s) {
  if (s.status !== 0) return false
  const diff = new Date(s.startTime.replace(' ', 'T')) - Date.now()
  return diff > 0 && diff < 24 * 3600 * 1000
}

async function loadData() {
  loading.value = true
  try {
    const data = await pageSchedules(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.courseId = null
  dateRange.value = null
  query.pageNum = 1
  loadData()
}

onMounted(async () => {
  loadData()
  const data = await pageCourses({ pageNum: 1, pageSize: 100 })
  courseOptions.value = data.list
})
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .schedule-card {
    &:hover {
      transform: translateY(-2px);
    }

    .schedule-body {
      display: flex;
      align-items: center;
      gap: 24px;

      .time-block {
        min-width: 110px;
        text-align: center;
        padding: 8px 12px;
        border-radius: var(--radius-base);
        background: var(--color-primary-light);

        &.soon {
          background: color-mix(in srgb, var(--color-danger) 10%, transparent);
        }

        .date {
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .time {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-primary);
          margin: 2px 0;
        }
      }

      .info-block {
        flex: 1;
        min-width: 0;

        .title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .meta {
          margin-top: 8px;
          display: flex;
          gap: 18px;
          font-size: 13px;
          color: var(--color-text-secondary);

          span {
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      .status-block {
        text-align: center;
      }
    }
  }
}
</style>
