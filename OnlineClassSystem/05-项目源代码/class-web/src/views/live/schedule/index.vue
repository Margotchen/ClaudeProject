<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">直播排课</div>
      <div class="page-desc">{{ canManage ? '为课程安排直播场次' : '查看全部直播场次安排' }}</div>
    </div>

    <BaseCard>
      <div class="toolbar">
        <el-select v-model="query.courseId" placeholder="按课程筛选" clearable filterable style="width: 220px">
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
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="未开始" :value="0" />
          <el-option label="直播中" :value="1" />
          <el-option label="已结束" :value="2" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button v-if="canManage" type="primary" :icon="Plus" style="margin-left: auto" @click="openDialog()">
          新增排课
        </el-button>
      </div>

      <el-skeleton v-if="loading && !tableData.length" :rows="5" animated />
      <el-table v-else v-loading="loading" :data="tableData" stripe>
        <template #empty><el-empty description="暂无直播排课" :image-size="80" /></template>
        <el-table-column prop="liveTitle" label="直播主题" min-width="150" show-overflow-tooltip />
        <el-table-column prop="courseName" label="所属课程" min-width="130" show-overflow-tooltip />
        <el-table-column prop="teacherName" label="讲师" width="100" />
        <el-table-column prop="startTime" label="开播时间" width="170" />
        <el-table-column label="时长" width="80" align="center">
          <template #default="{ row }">{{ row.duration }} 分钟</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="{ 0: 'info', 1: 'danger', 2: 'success' }[row.status]">
              {{ { 0: '未开始', 1: '直播中', 2: '已结束' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canManage" label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :disabled="row.status !== 0" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" :disabled="row.status === 1" @click="handleDelete(row)">删除</el-button>
            <el-button v-if="row.status !== 2" link type="success" @click="enterRoom(row)">
              {{ row.status === 1 ? '进入课堂' : '课堂准备' }}
            </el-button>
            <el-button v-else link type="info" disabled>课堂结束</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @change="loadData"
      />
    </BaseCard>

    <!-- 新增 / 编辑排课 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑排课' : '新增排课'" width="480px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="选择课程" filterable style="width: 100%" :disabled="!!form.id">
            <el-option v-for="c in manageableCourses" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="直播主题" prop="liveTitle">
          <el-input v-model="form.liveTitle" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="开播时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开播时间"
            :disabled-date="(d) => d.getTime() < Date.now() - 86400000"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="duration">
          <el-input-number v-model="form.duration" :min="1" :max="600" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pageSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../../api/live'
import { pageCourses } from '../../../api/course'
import { useUserStore } from '../../../store/user'

const userStore = useUserStore()
const router = useRouter()
const canManage = computed(() => ['ADMIN', 'TEACHER'].includes(userStore.roleCode))

function enterRoom(row) {
  router.push(`/live/room/${row.id}`)
}

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const courseOptions = ref([])
const manageableCourses = ref([])
const dateRange = ref(null)
const query = reactive({ pageNum: 1, pageSize: 10, courseId: null, status: null, startDate: '', endDate: '' })

const dialogVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, courseId: null, liveTitle: '', startTime: '', duration: 90 })
const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  liveTitle: [{ required: true, message: '请输入直播主题', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开播时间', trigger: 'change' }],
  duration: [{ required: true, message: '请填写时长', trigger: 'blur' }]
}

watch(dateRange, (val) => {
  query.startDate = val?.[0] || ''
  query.endDate = val?.[1] || ''
})

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
  query.status = null
  dateRange.value = null
  query.pageNum = 1
  loadData()
}

function openDialog(row) {
  Object.assign(form, row
    ? { id: row.id, courseId: row.courseId, liveTitle: row.liveTitle, startTime: row.startTime, duration: row.duration }
    : { id: null, courseId: null, liveTitle: '', startTime: '', duration: 90 })
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateSchedule(form.id, form)
    } else {
      await createSchedule(form)
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除排课「${row.liveTitle}」吗？`, '警告', { type: 'warning' })
  await deleteSchedule(row.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(async () => {
  loadData()
  // 排课筛选/选择课程用：加载可见课程（讲师接口已限定为自己的课）
  const data = await pageCourses({ pageNum: 1, pageSize: 100 })
  courseOptions.value = data.list
  manageableCourses.value = data.list.filter((c) => c.status === 1)
})
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
