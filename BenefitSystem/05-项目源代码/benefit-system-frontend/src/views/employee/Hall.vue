<template>
  <div class="hall-page">
    <h2>活动大厅</h2>

    <el-skeleton v-if="loading" :rows="5" animated />

    <el-empty v-else-if="!activities.length" description="暂无可参与的福利活动" :image-size="80" />

    <el-row :gutter="20" v-else>
      <el-col :span="8" v-for="activity in activities" :key="activity.id" class="activity-card-col">
        <el-card shadow="hover" class="activity-card">
          <template #header>
            <div class="card-header">
              <span>{{ activity.activity_name }}</span>
              <el-tag type="success">进行中</el-tag>
            </div>
          </template>

          <div class="activity-info">
            <p><strong>活动类型：</strong>{{ activity.activity_type }}</p>
            <p><strong>开始时间：</strong>{{ formatTime(activity.start_time) }}</p>
            <p><strong>结束时间：</strong>{{ formatTime(activity.end_time) }}</p>
            <p><strong>每人限选：</strong>{{ activity.limit_count }} 件</p>
            <p class="description">{{ activity.description || '暂无说明' }}</p>
          </div>

          <el-button
            type="primary"
            style="width: 100%; margin-top: 12px"
            @click="handleApply(activity)"
          >
            {{ hasApplied(activity.id) ? '查看申领' : '立即申领' }}
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAvailableActivities } from '@/api/activity'
import { getMyApplyList } from '@/api/apply'

const router = useRouter()
const activities = ref([])
const myApplies = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [activityRes, applyRes] = await Promise.all([
      getAvailableActivities(),
      getMyApplyList({ page: 1, pageSize: 1000 })
    ])
    activities.value = activityRes.data || []
    myApplies.value = applyRes.data?.list || []
  } catch {
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
})

const hasApplied = (activityId) => {
  return myApplies.value.some(a => a.activity_id === activityId && a.apply_status !== 4)
}

const getApply = (activityId) => {
  return myApplies.value.find(a => a.activity_id === activityId && a.apply_status !== 4)
}

const handleApply = async (activity) => {
  const existing = getApply(activity.id)
  if (existing) {
    try {
      await ElMessageBox.confirm(
        '您已申领该活动，是否前往修改？',
        '提示',
        {
          confirmButtonText: '去修改',
          cancelButtonText: '查看我的申领',
          type: 'info'
        }
      )
      router.push(`/employee/activity/${activity.id}`)
    } catch {
      router.push('/employee/my-apply')
    }
  } else {
    router.push(`/employee/activity/${activity.id}`)
  }
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}
</script>

<style scoped>
.hall-page h2 {
  margin-bottom: 20px;
}

.activity-card-col {
  margin-bottom: 20px;
}

.activity-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-card:hover {
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-info p {
  margin: 8px 0;
  color: var(--color-text-secondary);
}

.description {
  color: var(--color-text-placeholder);
  font-size: 13px;
  min-height: 40px;
}
</style>
