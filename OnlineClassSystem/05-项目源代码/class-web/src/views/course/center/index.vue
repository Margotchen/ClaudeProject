<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">课程中心</div>
      <div class="page-desc">浏览平台上架的全部课程</div>
    </div>

    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="搜索课程名称"
        clearable
        style="width: 220px"
        @keyup.enter="loadData"
      />
      <el-button type="primary" :icon="Search" @click="loadData">搜索</el-button>
    </div>

    <el-skeleton v-if="loading" :rows="4" animated />
    <template v-else>
      <el-empty v-if="!courseList.length" description="暂无上架课程" />
      <div v-else class="course-grid">
        <BaseCard v-for="course in courseList" :key="course.id" class="course-card" @click="openDetail(course)">
          <div class="course-cover">
            <el-image v-if="course.coverUrl" :src="course.coverUrl" fit="cover" class="cover-img" lazy />
            <div v-else class="cover-placeholder">
              <el-icon :size="40"><Reading /></el-icon>
            </div>
          </div>
          <div class="course-info">
            <div class="course-name">{{ course.courseName }}</div>
            <div class="course-desc">{{ course.description || '暂无简介' }}</div>
            <div class="course-meta">
              <span><el-icon><User /></el-icon>{{ course.teacherName }}</span>
              <span><el-icon><VideoCamera /></el-icon>{{ course.scheduleCount }} 场直播</span>
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

    <!-- 课程详情 -->
    <el-drawer v-model="detailVisible" :title="detail.courseName" size="480px">
      <div class="detail-section">
        <div class="detail-label">课程简介</div>
        <p class="detail-text">{{ detail.description || '暂无简介' }}</p>
      </div>
      <div class="detail-section">
        <div class="detail-label">授课讲师</div>
        <p class="detail-text">{{ detail.teacherName }}</p>
      </div>
      <div class="detail-section">
        <div class="detail-label">适用人群</div>
        <p class="detail-text">{{ detail.targetAudience || '—' }}</p>
      </div>
      <div class="detail-section">
        <div class="detail-label">课程大纲</div>
        <p class="detail-text pre-line">{{ detail.syllabus || '暂无大纲' }}</p>
      </div>
      <div class="detail-section">
        <div class="detail-label">近期直播</div>
        <el-timeline v-if="detailSchedules.length">
          <el-timeline-item
            v-for="s in detailSchedules"
            :key="s.id"
            :timestamp="`${s.startTime}（${s.duration}分钟）`"
            :type="s.status === 0 ? 'primary' : 'info'"
          >
            {{ s.liveTitle }}
            <el-tag size="small" style="margin-left: 8px" :type="{ 0: 'info', 1: 'danger', 2: 'success' }[s.status]">
              {{ { 0: '未开始', 1: '直播中', 2: '已结束' }[s.status] }}
            </el-tag>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无排课" :image-size="60" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Search, Reading, User, VideoCamera } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pageCourses } from '../../../api/course'
import { pageSchedules } from '../../../api/live'

const loading = ref(false)
const courseList = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 12, keyword: '' })

const detailVisible = ref(false)
const detail = ref({})
const detailSchedules = ref([])

async function loadData() {
  loading.value = true
  try {
    const data = await pageCourses(query)
    courseList.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function openDetail(course) {
  detail.value = course
  detailVisible.value = true
  const data = await pageSchedules({ courseId: course.id, pageNum: 1, pageSize: 50 })
  detailSchedules.value = data.list
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;

  .course-card {
    cursor: pointer;

    :deep(.card-body) {
      padding: 0;
    }

    .course-cover {
      height: 140px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-end));

      .cover-img {
        width: 100%;
        height: 100%;

        :deep(img) {
          animation: img-fade-in 0.4s ease;
        }

        @keyframes img-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      }

      .cover-placeholder {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .course-info {
      padding: 14px 16px;

      .course-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .course-desc {
        margin-top: 6px;
        font-size: 12px;
        color: var(--color-text-secondary);
        height: 34px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .course-meta {
        margin-top: 8px;
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--color-text-placeholder);

        span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      }
    }
  }
}

.detail-section {
  margin-bottom: 20px;

  .detail-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 6px;
  }

  .detail-text {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.6;

    &.pre-line {
      white-space: pre-line;
    }
  }
}
</style>
