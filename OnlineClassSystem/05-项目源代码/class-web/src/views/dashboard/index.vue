<template>
  <div class="page-container dashboard">
    <!-- 欢迎卡 -->
    <BaseCard class="welcome-card">
      <div class="welcome-body">
        <div>
          <div class="greeting">{{ greeting }}，{{ userStore.userInfo?.realName }}</div>
          <div class="welcome-sub">{{ todayText }} · {{ userStore.userInfo?.roleName }}</div>
        </div>
        <el-icon :size="56" class="welcome-icon"><Sunny /></el-icon>
      </div>
    </BaseCard>

    <!-- 指标卡 -->
    <div class="stat-cards">
      <BaseCard v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-value">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </BaseCard>
    </div>

    <div class="dashboard-row">
      <!-- 今日直播 -->
      <BaseCard class="today-card">
        <template #header>今日直播</template>
        <el-skeleton v-if="scheduleLoading" :rows="3" animated />
        <el-empty v-else-if="!todaySchedules.length" description="今日暂无直播安排" :image-size="80" />
        <div v-else class="today-list">
          <div v-for="s in todaySchedules" :key="s.id" class="today-item" @click="enterRoom(s)">
            <div class="today-time">{{ shortTime(s.startTime) }}</div>
            <div class="today-info">
              <div class="today-title">{{ s.liveTitle }}</div>
              <div class="today-meta">{{ s.courseName }} · {{ s.teacherName }} · {{ s.duration }}分钟</div>
            </div>
            <el-tag :type="{ 0: 'info', 1: 'danger', 2: 'success' }[s.status]" size="small" effect="dark">
              {{ { 0: '未开始', 1: '直播中', 2: '已结束' }[s.status] }}
            </el-tag>
          </div>
        </div>
      </BaseCard>

      <!-- 快捷入口 -->
      <BaseCard class="shortcut-card">
        <template #header>快捷入口</template>
        <div class="shortcut-grid">
          <div v-for="sc in shortcuts" :key="sc.path" class="shortcut-item" @click="$router.push(sc.path)">
            <el-icon :size="26" class="shortcut-icon"><component :is="sc.icon" /></el-icon>
            <span>{{ sc.title }}</span>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '../../components/BaseCard.vue'
import { useUserStore } from '../../store/user'
import { statsOverview, myProgress } from '../../api/stats'
import { pageSchedules } from '../../api/live'

const userStore = useUserStore()
const router = useRouter()
const isStudent = computed(() => userStore.roleCode === 'STUDENT')

const overview = ref({})
const my = ref({})
const todaySchedules = ref([])
const scheduleLoading = ref(false)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const todayText = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
})

const formatDuration = (seconds) => {
  const s = seconds || 0
  if (s < 60) return `${s}秒`
  if (s < 3600) return `${Math.floor(s / 60)}分钟`
  return `${(s / 3600).toFixed(1)}小时`
}

const statCards = computed(() => {
  if (isStudent.value) {
    return [
      { label: '总学习时长', value: formatDuration(my.value.totalSeconds) },
      { label: '作业完成率', value: `${my.value.homeworkRate ?? 0}%` },
      { label: '考试平均分', value: my.value.examAvg ?? '-' }
    ]
  }
  return [
    { label: '课程总数', value: overview.value.courseCount ?? 0 },
    { label: '参与学生', value: overview.value.studentCount ?? 0 },
    { label: '总学习时长', value: formatDuration(overview.value.totalSeconds) },
    { label: '作业提交率', value: `${overview.value.homeworkRate ?? 0}%` },
    { label: '考试平均分', value: overview.value.examAvg ?? '-' }
  ]
})

// 按角色过滤的快捷入口
const ALL_SHORTCUTS = [
  { title: '用户管理', path: '/system/user', icon: 'User', roles: ['ADMIN'] },
  { title: '课程管理', path: '/course/list', icon: 'Reading', roles: ['ADMIN', 'TEACHER'] },
  { title: '课程中心', path: '/course/center', icon: 'Collection', roles: ['STUDENT', 'HEAD_TEACHER'] },
  { title: '直播排课', path: '/live/schedule', icon: 'VideoCamera', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER'] },
  { title: '课堂监督', path: '/live/monitor', icon: 'View', roles: ['ADMIN', 'HEAD_TEACHER'] },
  { title: '课程录播', path: '/live/playback', icon: 'Film', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] },
  { title: '我的课表', path: '/study/schedule', icon: 'Calendar', roles: ['STUDENT'] },
  { title: '作业考试', path: '/study/homework', icon: 'EditPen', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] },
  { title: '学习统计', path: '/stats', icon: 'DataAnalysis', roles: ['ADMIN', 'TEACHER', 'HEAD_TEACHER', 'STUDENT'] }
]
const shortcuts = computed(() => ALL_SHORTCUTS.filter(s => s.roles.includes(userStore.roleCode)))

function shortTime(t) {
  return t ? t.replace('T', ' ').slice(11, 16) : ''
}

function enterRoom(s) {
  if (s.status !== 2) {
    router.push(`/live/room/${s.id}`)
  }
}

onMounted(async () => {
  // 指标数据
  if (isStudent.value) {
    myProgress().then(res => { my.value = res }).catch(() => {})
  } else {
    statsOverview().then(res => { overview.value = res }).catch(() => {})
  }
  // 今日直播
  scheduleLoading.value = true
  try {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const data = await pageSchedules({ pageNum: 1, pageSize: 20, startDate: dateStr, endDate: dateStr })
    todaySchedules.value = data.list
  } finally {
    scheduleLoading.value = false
  }
})
</script>

<style lang="scss" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .welcome-card {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-end));

    :deep(.card-body) {
      padding: 24px 28px;
    }

    .welcome-body {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .greeting {
        font-size: 22px;
        font-weight: 600;
        color: #fff;
      }

      .welcome-sub {
        margin-top: 6px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.85);
      }

      .welcome-icon {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }

  .stat-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;

    .stat-card {
      text-align: center;

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: var(--color-primary);
      }

      .stat-label {
        margin-top: 6px;
        font-size: 13px;
        color: var(--color-text-secondary);
      }
    }
  }

  .dashboard-row {
    display: grid;
    grid-template-columns: 3fr 2fr;
    gap: 16px;
    align-items: start;

    @media (max-width: 1366px) {
      grid-template-columns: 1fr;
    }
  }

  .today-list {
    .today-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 8px;
      border-radius: var(--radius-base);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: var(--color-primary-light);
      }

      .today-time {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-primary);
        min-width: 48px;
      }

      .today-info {
        flex: 1;
        min-width: 0;

        .today-title {
          font-weight: 600;
          color: var(--color-text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .today-meta {
          margin-top: 2px;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
      }
    }
  }

  .shortcut-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 12px;

    .shortcut-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 8px;
      border-radius: var(--radius-base);
      cursor: pointer;
      font-size: 13px;
      color: var(--color-text-secondary);
      transition: all 0.3s ease;

      .shortcut-icon {
        color: var(--color-primary);
        transition: transform 0.3s ease;
      }

      &:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);

        .shortcut-icon {
          transform: scale(1.15);
        }
      }
    }
  }
}
</style>
