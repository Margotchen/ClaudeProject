<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">课程管理</div>
      <div class="page-desc">{{ isAdmin ? '管理平台全部课程' : '管理我讲授的课程' }}</div>
    </div>

    <div class="toolbar">
      <el-input
        v-model="query.keyword"
        placeholder="课程名称"
        clearable
        style="width: 200px"
        @keyup.enter="loadData"
      />
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px">
        <el-option label="已上架" :value="1" />
        <el-option label="已下架" :value="0" />
      </el-select>
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      <el-button type="primary" :icon="Plus" style="margin-left: auto" @click="openDialog()">
        新建课程
      </el-button>
    </div>

    <el-skeleton v-if="loading" :rows="4" animated />
    <template v-else>
      <el-empty v-if="!courseList.length" description="暂无课程" />
      <div v-else class="course-grid">
        <BaseCard v-for="course in courseList" :key="course.id" class="course-card">
          <div class="course-cover">
            <el-image v-if="course.coverUrl" :src="course.coverUrl" fit="cover" class="cover-img" lazy />
            <div v-else class="cover-placeholder">
              <el-icon :size="40"><Reading /></el-icon>
            </div>
            <el-tag
              class="status-tag"
              :type="course.status === 1 ? 'success' : 'info'"
              effect="dark"
              size="small"
            >{{ course.status === 1 ? '已上架' : '已下架' }}</el-tag>
          </div>
          <div class="course-info">
            <div class="course-name" :title="course.courseName">{{ course.courseName }}</div>
            <div class="course-desc" :title="course.description">{{ course.description || '暂无简介' }}</div>
            <div class="course-meta">
              <span><el-icon><User /></el-icon>{{ course.teacherName }}</span>
              <span><el-icon><VideoCamera /></el-icon>{{ course.scheduleCount }} 场直播</span>
            </div>
          </div>
          <div class="course-actions">
            <el-button link type="primary" @click="openDetail(course)">详情</el-button>
            <el-button link type="primary" @click="openDialog(course)">编辑</el-button>
            <el-button link :type="course.status === 1 ? 'warning' : 'success'" @click="handleStatus(course)">
              {{ course.status === 1 ? '下架' : '上架' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(course)">删除</el-button>
          </div>
        </BaseCard>
      </div>
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[8, 12, 24]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px; justify-content: flex-end"
        @change="loadData"
      />
    </template>

    <!-- 新增 / 编辑 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑课程' : '新建课程'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="课程名称" prop="courseName">
          <el-input v-model="form.courseName" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item v-if="isAdmin" label="授课讲师" prop="teacherId">
          <el-select v-model="form.teacherId" placeholder="选择讲师" style="width: 100%">
            <el-option v-for="t in teacherList" :key="t.id" :label="t.realName" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程简介">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.coverUrl" placeholder="图片 URL（选填）" />
        </el-form-item>
        <el-form-item label="课程大纲">
          <el-input v-model="form.syllabus" type="textarea" :rows="4" placeholder="每行一个章节" />
        </el-form-item>
        <el-form-item label="适用人群">
          <el-input v-model="form.targetAudience" placeholder="如：零基础学员" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 课程详情抽屉 -->
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
        <div class="detail-label">直播场次</div>
        <el-table :data="detailSchedules" size="small">
          <el-table-column prop="liveTitle" label="主题" min-width="120" show-overflow-tooltip />
          <el-table-column prop="startTime" label="开播时间" width="150" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" :type="scheduleTagType(row.status)">{{ scheduleStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!detailSchedules.length" description="暂无排课" :image-size="60" />
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Reading, User, VideoCamera } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pageCourses, createCourse, updateCourse, deleteCourse, updateCourseStatus } from '../../../api/course'
import { pageSchedules } from '../../../api/live'
import { listTeachers } from '../../../api/user'
import { useUserStore } from '../../../store/user'

const userStore = useUserStore()
const isAdmin = computed(() => userStore.roleCode === 'ADMIN')

const loading = ref(false)
const saving = ref(false)
const courseList = ref([])
const total = ref(0)
const teacherList = ref([])
const query = reactive({ pageNum: 1, pageSize: 12, keyword: '', status: null })

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, courseName: '', teacherId: null, description: '', coverUrl: '', syllabus: '', targetAudience: '' })
const formRules = {
  courseName: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  teacherId: [{ required: true, message: '请选择讲师', trigger: 'change' }]
}

const detailVisible = ref(false)
const detail = ref({})
const detailSchedules = ref([])

function scheduleStatusText(s) {
  return { 0: '未开始', 1: '直播中', 2: '已结束' }[s] ?? '未知'
}
function scheduleTagType(s) {
  return { 0: 'info', 1: 'danger', 2: 'success' }[s] ?? 'info'
}

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

function resetQuery() {
  query.keyword = ''
  query.status = null
  query.pageNum = 1
  loadData()
}

function openDialog(row) {
  Object.assign(form, row
    ? { id: row.id, courseName: row.courseName, teacherId: row.teacherId, description: row.description, coverUrl: row.coverUrl, syllabus: row.syllabus, targetAudience: row.targetAudience }
    : { id: null, courseName: '', teacherId: null, description: '', coverUrl: '', syllabus: '', targetAudience: '' })
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateCourse(form.id, form)
    } else {
      await createCourse(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleStatus(course) {
  const action = course.status === 1 ? '下架' : '上架'
  await ElMessageBox.confirm(`确定${action}课程「${course.courseName}」吗？`, '提示', { type: 'warning' })
  await updateCourseStatus(course.id, course.status === 1 ? 0 : 1)
  ElMessage.success(`${action}成功`)
  loadData()
}

async function handleDelete(course) {
  await ElMessageBox.confirm(`删除课程「${course.courseName}」将同时删除其全部排课，确定吗？`, '警告', { type: 'warning' })
  await deleteCourse(course.id)
  ElMessage.success('删除成功')
  loadData()
}

async function openDetail(course) {
  detail.value = course
  detailVisible.value = true
  const data = await pageSchedules({ courseId: course.id, pageNum: 1, pageSize: 50 })
  detailSchedules.value = data.list
}

onMounted(async () => {
  loadData()
  if (isAdmin.value) {
    teacherList.value = await listTeachers()
  }
})
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
    :deep(.card-body) {
      padding: 0;
    }

    .course-cover {
      position: relative;
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

      .status-tag {
        position: absolute;
        top: 10px;
        right: 10px;
      }
    }

    .course-info {
      padding: 14px 16px 6px;

      .course-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

    .course-actions {
      padding: 4px 12px 10px;
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
