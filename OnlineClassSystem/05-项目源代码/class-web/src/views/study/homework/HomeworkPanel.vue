<template>
  <div>
    <div class="toolbar">
      <el-select v-model="query.courseId" placeholder="按课程筛选" clearable filterable style="width: 220px">
        <el-option v-for="c in courseOptions" :key="c.id" :label="c.courseName" :value="c.id" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="作业标题关键字" clearable style="width: 200px" />
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      <el-button v-if="canManage" type="primary" :icon="Plus" style="margin-left: auto" @click="openEdit()">
        布置作业
      </el-button>
    </div>

    <el-skeleton v-if="loading && !tableData.length" :rows="5" animated />
    <el-table v-else v-loading="loading" :data="tableData" stripe>
      <template #empty><el-empty description="暂无作业" :image-size="80" /></template>
      <el-table-column prop="title" label="作业标题" min-width="150" show-overflow-tooltip />
      <el-table-column prop="courseName" label="所属课程" min-width="130" show-overflow-tooltip />
      <el-table-column prop="creatorName" label="布置人" width="100" />
      <el-table-column prop="deadline" label="截止时间" width="170" />
      <el-table-column v-if="canManage || isHeadTeacher" label="提交情况" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="info">{{ row.gradedCount }}/{{ row.submissionCount }} 已批改</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="isStudent" label="我的状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.myStatus === 1" type="success">已批改 {{ row.myScore }}分</el-tag>
          <el-tag v-else-if="row.myStatus === 0" type="warning">待批改</el-tag>
          <el-tag v-else type="info">未提交</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="isStudent ? 180 : 230" fixed="right">
        <template #default="{ row }">
          <template v-if="isStudent">
            <el-button link type="primary" @click="openSubmit(row)">
              {{ row.myStatus === null || row.myStatus === undefined ? '提交作业' : '重新提交' }}
            </el-button>
            <el-button v-if="row.myStatus !== null && row.myStatus !== undefined" link type="success" @click="viewMine(row)">
              查看提交
            </el-button>
          </template>
          <template v-else-if="canManage">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="success" @click="openSubmissions(row)">批改</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
          <template v-else>
            <span class="text-muted">仅查看</span>
          </template>
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

    <!-- 布置/编辑作业 -->
    <el-dialog v-model="editVisible" :title="form.id ? '编辑作业' : '布置作业'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="选择课程" filterable style="width: 100%" :disabled="!!form.id">
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="作业内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择截止时间"
            :disabled-date="(d) => d.getTime() < Date.now() - 86400000"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 学生提交作业 -->
    <el-dialog v-model="submitVisible" :title="`提交作业：${current?.title || ''}`" width="560px">
      <el-alert type="info" :closable="false" style="margin-bottom: 12px">
        截止时间：{{ current?.deadline }}；重复提交将覆盖上次内容
      </el-alert>
      <el-form label-width="90px">
        <el-form-item label="作业内容">
          <el-input v-model="submitForm.content" type="textarea" :rows="5" maxlength="2000" show-word-limit
            placeholder="填写作业内容" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            :limit="1"
            :show-file-list="true"
            :http-request="doUpload"
            :before-upload="beforeUpload"
            :on-remove="() => { submitForm.attachmentName = ''; submitForm.attachmentPath = '' }"
          >
            <el-button :icon="UploadFilled">上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持文档/图片/压缩包，不超过 20MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 学生查看自己的提交 -->
    <el-drawer v-model="mineVisible" title="我的提交" size="440px">
      <template v-if="mine">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="提交时间">{{ mine.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="mine.status === 1 ? 'success' : 'warning'">
              {{ mine.status === 1 ? '已批改' : '待批改' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="内容">{{ mine.content || '（无）' }}</el-descriptions-item>
          <el-descriptions-item v-if="mine.attachmentPath" label="附件">
            <el-link type="primary" :href="fileDownloadUrl(mine.attachmentPath, mine.attachmentName)">
              {{ mine.attachmentName }}
            </el-link>
          </el-descriptions-item>
          <template v-if="mine.status === 1">
            <el-descriptions-item label="得分">
              <span class="score-text">{{ mine.score }} 分</span>
            </el-descriptions-item>
            <el-descriptions-item label="评语">{{ mine.comment || '（无）' }}</el-descriptions-item>
            <el-descriptions-item label="批改人">{{ mine.graderName }}</el-descriptions-item>
          </template>
        </el-descriptions>
      </template>
    </el-drawer>

    <!-- 教师批改抽屉 -->
    <el-drawer v-model="subsVisible" :title="`作业批改：${current?.title || ''}`" size="640px">
      <el-table v-loading="subsLoading" :data="submissions" stripe>
        <el-table-column prop="studentName" label="学生" width="100" />
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? `${row.score}分` : '待批改' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGrade(row)">批改</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="subsQuery.pageNum"
        v-model:page-size="subsQuery.pageSize"
        :total="subsTotal"
        layout="total, prev, pager, next"
        style="margin-top: 12px; justify-content: flex-end"
        @change="loadSubmissions"
      />
    </el-drawer>

    <!-- 批改打分 -->
    <el-dialog v-model="gradeVisible" :title="`批改：${grading?.studentName || ''}`" width="520px">
      <template v-if="grading">
        <el-descriptions :column="1" border style="margin-bottom: 16px">
          <el-descriptions-item label="提交内容">{{ grading.content || '（无）' }}</el-descriptions-item>
          <el-descriptions-item v-if="grading.attachmentPath" label="附件">
            <el-link type="primary" :href="fileDownloadUrl(grading.attachmentPath, grading.attachmentName)">
              {{ grading.attachmentName }}
            </el-link>
          </el-descriptions-item>
        </el-descriptions>
        <el-form label-width="90px">
          <el-form-item label="分数">
            <el-input-number v-model="gradeForm.score" :min="0" :max="100" />
          </el-form-item>
          <el-form-item label="评语">
            <el-input v-model="gradeForm.comment" type="textarea" :rows="3" maxlength="500" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="gradeVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleGrade">提交批改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, UploadFilled } from '@element-plus/icons-vue'
import {
  pageHomework, createHomework, updateHomework, deleteHomework,
  submitHomework, pageSubmissions, mySubmission, gradeHomework,
  uploadFile, fileDownloadUrl
} from '../../../api/homework'
import { useUserStore } from '../../../store/user'

const props = defineProps({ courseOptions: { type: Array, default: () => [] } })

const userStore = useUserStore()
const canManage = computed(() => ['ADMIN', 'TEACHER'].includes(userStore.roleCode))
const isHeadTeacher = computed(() => userStore.roleCode === 'HEAD_TEACHER')
const isStudent = computed(() => userStore.roleCode === 'STUDENT')

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const total = ref(0)
const query = reactive({ pageNum: 1, pageSize: 10, courseId: null, keyword: '' })

async function loadData() {
  loading.value = true
  try {
    const data = await pageHomework(query)
    tableData.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}
function resetQuery() {
  query.courseId = null
  query.keyword = ''
  query.pageNum = 1
  loadData()
}

// ---- 布置/编辑 ----
const editVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, courseId: null, title: '', content: '', deadline: '' })
const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }]
}
function openEdit(row) {
  Object.assign(form, row
    ? { id: row.id, courseId: row.courseId, title: row.title, content: row.content, deadline: row.deadline }
    : { id: null, courseId: null, title: '', content: '', deadline: '' })
  editVisible.value = true
  // 清除上次遗留的校验红字
  nextTick(() => formRef.value?.clearValidate())
}
async function handleSave() {
  await formRef.value.validate()
  saving.value = true
  try {
    if (form.id) {
      await updateHomework(form.id, form)
    } else {
      await createHomework(form)
    }
    ElMessage.success('保存成功')
    editVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除作业「${row.title}」？`, '删除确认', { type: 'warning' })
  await deleteHomework(row.id)
  ElMessage.success('删除成功')
  loadData()
}

// ---- 学生提交 ----
const current = ref(null)
const submitVisible = ref(false)
const submitForm = reactive({ content: '', attachmentName: '', attachmentPath: '' })
async function openSubmit(row) {
  current.value = row
  submitForm.content = ''
  submitForm.attachmentName = ''
  submitForm.attachmentPath = ''
  // 回填上次提交内容
  if (row.myStatus !== null && row.myStatus !== undefined) {
    const mine = await mySubmission(row.id)
    if (mine) {
      submitForm.content = mine.content || ''
      submitForm.attachmentName = mine.attachmentName || ''
      submitForm.attachmentPath = mine.attachmentPath || ''
    }
  }
  submitVisible.value = true
}
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024 // 20MB
function beforeUpload(file) {
  if (file.size > MAX_UPLOAD_SIZE) {
    ElMessage.error('附件大小不能超过 20MB')
    return false
  }
  return true
}
async function doUpload({ file }) {
  const data = await uploadFile(file)
  submitForm.attachmentName = data.name
  submitForm.attachmentPath = data.path
  ElMessage.success('附件上传成功')
}
async function handleSubmit() {
  if (!submitForm.content && !submitForm.attachmentPath) {
    ElMessage.warning('请填写作业内容或上传附件')
    return
  }
  saving.value = true
  try {
    await submitHomework({ homeworkId: current.value.id, ...submitForm })
    ElMessage.success('提交成功')
    submitVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

// ---- 学生查看 ----
const mineVisible = ref(false)
const mine = ref(null)
async function viewMine(row) {
  mine.value = await mySubmission(row.id)
  mineVisible.value = true
}

// ---- 教师批改 ----
const subsVisible = ref(false)
const subsLoading = ref(false)
const submissions = ref([])
const subsTotal = ref(0)
const subsQuery = reactive({ pageNum: 1, pageSize: 10 })
function openSubmissions(row) {
  current.value = row
  subsQuery.pageNum = 1
  subsVisible.value = true
  loadSubmissions()
}
async function loadSubmissions() {
  subsLoading.value = true
  try {
    const data = await pageSubmissions(current.value.id, subsQuery)
    submissions.value = data.list || []
    subsTotal.value = data.total || 0
  } finally {
    subsLoading.value = false
  }
}
const gradeVisible = ref(false)
const grading = ref(null)
const gradeForm = reactive({ score: 0, comment: '' })
function openGrade(row) {
  grading.value = row
  gradeForm.score = row.score ?? 0
  gradeForm.comment = row.comment || ''
  gradeVisible.value = true
}
async function handleGrade() {
  saving.value = true
  try {
    await gradeHomework({ submissionId: grading.value.id, ...gradeForm })
    ElMessage.success('批改完成')
    gradeVisible.value = false
    loadSubmissions()
    loadData()
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.text-muted {
  color: var(--color-text-placeholder, #86909c);
  font-size: 13px;
}
.score-text {
  color: var(--color-danger, #f53f3f);
  font-weight: 600;
  font-size: 16px;
}
</style>
