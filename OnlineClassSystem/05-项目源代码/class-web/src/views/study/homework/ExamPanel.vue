<template>
  <div>
    <div class="toolbar">
      <el-select v-model="query.courseId" placeholder="按课程筛选" clearable filterable style="width: 220px">
        <el-option v-for="c in courseOptions" :key="c.id" :label="c.courseName" :value="c.id" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="考试标题关键字" clearable style="width: 200px" />
      <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
      <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      <el-button v-if="canManage" type="primary" :icon="Plus" style="margin-left: auto" @click="openEdit()">
        创建考试
      </el-button>
    </div>

    <el-skeleton v-if="loading && !tableData.length" :rows="5" animated />
    <el-table v-else v-loading="loading" :data="tableData" stripe>
      <template #empty><el-empty description="暂无考试" :image-size="80" /></template>
      <el-table-column prop="title" label="考试标题" min-width="140" show-overflow-tooltip />
      <el-table-column prop="courseName" label="所属课程" min-width="120" show-overflow-tooltip />
      <el-table-column label="考试窗口" width="220">
        <template #default="{ row }">
          <div class="window-text">{{ row.startTime }}<br />至 {{ row.endTime }}</div>
        </template>
      </el-table-column>
      <el-table-column label="时长" width="80" align="center">
        <template #default="{ row }">{{ row.duration }}分钟</template>
      </el-table-column>
      <el-table-column prop="totalScore" label="总分" width="70" align="center" />
      <el-table-column v-if="canManage || isHeadTeacher" prop="recordCount" label="答卷数" width="80" align="center" />
      <el-table-column v-if="isStudent" label="我的成绩" width="120" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.myStatus === 2" type="success">{{ row.myScore }}分</el-tag>
          <el-tag v-else-if="row.myStatus === 1" type="warning">待批改</el-tag>
          <el-tag v-else-if="row.myStatus === 0" type="warning">答题中</el-tag>
          <el-tag v-else type="info">未参加</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="isStudent ? 180 : 240" fixed="right">
        <template #default="{ row }">
          <template v-if="isStudent">
            <el-button link type="primary" @click="enterExam(row)">
              {{ row.myStatus === 0 ? '继续答题' : '进入考试' }}
            </el-button>
            <el-button v-if="row.myStatus !== null && row.myStatus !== undefined" link type="success" @click="viewScores(row)">
              成绩
            </el-button>
          </template>
          <template v-else-if="canManage">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="success" @click="openRecords(row)">答卷</el-button>
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

    <!-- 创建/编辑考试（含组题器） -->
    <el-dialog v-model="editVisible" :title="form.id ? '编辑考试' : '创建考试'" width="760px" top="4vh">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="选择课程" filterable style="width: 100%" :disabled="!!form.id">
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.courseName" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试标题" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="考试窗口" prop="window">
          <el-date-picker
            v-model="form.window"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="截止时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="时长(分钟)" prop="duration">
          <el-input-number v-model="form.duration" :min="1" :max="600" />
        </el-form-item>

        <el-form-item label="题目">
          <div class="question-list">
            <div v-for="(q, qi) in form.questions" :key="qi" class="question-item">
              <div class="question-head">
                <el-tag size="small" :type="{ CHOICE: 'primary', JUDGE: 'warning', ESSAY: 'success' }[q.type]">
                  {{ { CHOICE: '选择题', JUDGE: '判断题', ESSAY: '简答题' }[q.type] }}
                </el-tag>
                <span class="q-index">第 {{ qi + 1 }} 题</span>
                <el-input-number v-model="q.score" :min="1" :max="100" size="small" style="width: 110px" />
                <span class="text-muted">分</span>
                <el-button link type="danger" style="margin-left: auto" @click="form.questions.splice(qi, 1)">
                  删除
                </el-button>
              </div>
              <el-input v-model="q.stem" placeholder="题干" style="margin: 8px 0" />
              <template v-if="q.type === 'CHOICE'">
                <div v-for="(opt, oi) in q.options" :key="oi" class="option-row">
                  <el-radio v-model="q.answer" :value="String.fromCharCode(65 + oi)">
                    {{ String.fromCharCode(65 + oi) }}
                  </el-radio>
                  <el-input v-model="q.options[oi]" :placeholder="`选项 ${String.fromCharCode(65 + oi)}`" size="small" />
                </div>
                <div class="text-muted" style="font-size: 12px">选中单选框即设为正确答案</div>
              </template>
              <template v-else-if="q.type === 'JUDGE'">
                <el-radio-group v-model="q.answer">
                  <el-radio value="true">正确</el-radio>
                  <el-radio value="false">错误</el-radio>
                </el-radio-group>
              </template>
              <div v-else class="text-muted" style="font-size: 12px">简答题由讲师手动批改</div>
            </div>
            <div class="question-add">
              <el-button size="small" @click="addQuestion('CHOICE')">+ 选择题</el-button>
              <el-button size="small" @click="addQuestion('JUDGE')">+ 判断题</el-button>
              <el-button size="small" @click="addQuestion('ESSAY')">+ 简答题</el-button>
              <span class="text-muted" style="margin-left: auto">总分：{{ totalScorePreview }} 分</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 答卷列表抽屉 -->
    <el-drawer v-model="recordsVisible" :title="`答卷列表：${current?.title || ''}`" size="620px">
      <el-table v-loading="recordsLoading" :data="records" stripe>
        <el-table-column prop="studentName" label="学生" width="100" />
        <el-table-column prop="submitTime" label="交卷时间" width="160">
          <template #default="{ row }">{{ row.submitTime || '答题中' }}</template>
        </el-table-column>
        <el-table-column label="得分" width="130" align="center">
          <template #default="{ row }">
            <template v-if="row.status === 2">
              {{ row.totalScore }}（客观{{ row.objectiveScore }}+主观{{ row.subjectiveScore }}）
            </template>
            <el-tag v-else-if="row.status === 1" type="warning">待批改(客观{{ row.objectiveScore }})</el-tag>
            <el-tag v-else type="info">答题中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button v-if="row.status !== 0" link type="primary" @click="openGrade(row)">
              {{ row.status === 1 ? '批改' : '查看' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="recordsQuery.pageNum"
        v-model:page-size="recordsQuery.pageSize"
        :total="recordsTotal"
        layout="total, prev, pager, next"
        style="margin-top: 12px; justify-content: flex-end"
        @change="loadRecords"
      />
    </el-drawer>

    <!-- 批改答卷（简答题逐题打分） -->
    <el-dialog v-model="gradeVisible" :title="`批改答卷：${grading?.studentName || ''}`" width="680px">
      <template v-if="gradeDetail">
        <el-alert type="info" :closable="false" style="margin-bottom: 12px">
          客观题自动判分：{{ gradeDetail.objectiveScore ?? 0 }} 分
        </el-alert>
        <div v-for="(q, qi) in gradeDetail.questions" :key="qi" class="grade-question">
          <div class="q-stem">
            <el-tag size="small" :type="{ CHOICE: 'primary', JUDGE: 'warning', ESSAY: 'success' }[q.type]">
              {{ { CHOICE: '选择题', JUDGE: '判断题', ESSAY: '简答题' }[q.type] }}
            </el-tag>
            第 {{ qi + 1 }} 题（{{ q.score }}分）：{{ q.stem }}
          </div>
          <div class="q-answer">
            学生答案：{{ answerText(qi, q) }}
            <template v-if="q.type !== 'ESSAY'">；正确答案：{{ q.answer }}</template>
          </div>
          <div v-if="q.type === 'ESSAY'" class="q-score">
            打分：<el-input-number v-model="essayScoreMap[qi]" :min="0" :max="q.score" size="small" /> / {{ q.score }} 分
          </div>
        </div>
        <el-form label-width="90px" style="margin-top: 12px">
          <el-form-item label="评语">
            <el-input v-model="gradeComment" type="textarea" :rows="2" maxlength="500" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="gradeVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleGrade">提交批改</el-button>
      </template>
    </el-dialog>

    <!-- 学生成绩弹窗 -->
    <el-dialog v-model="scoresVisible" title="我的成绩" width="480px">
      <el-table :data="myScores" stripe>
        <el-table-column prop="submitTime" label="交卷时间">
          <template #default="{ row }">{{ row.submitTime || '答题中' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="{ 0: 'info', 1: 'warning', 2: 'success' }[row.status]">
              {{ { 0: '答题中', 1: '待批改', 2: '已批改' }[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总分" width="80" align="center">
          <template #default="{ row }">{{ row.status === 2 ? row.totalScore : '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import {
  pageExam, createExam, updateExam, deleteExam, getExamDetail,
  pageExamRecords, getRecordDetail, gradeExam, myExamRecords
} from '../../../api/homework'
import { useUserStore } from '../../../store/user'

const props = defineProps({ courseOptions: { type: Array, default: () => [] } })

const userStore = useUserStore()
const router = useRouter()
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
    const data = await pageExam(query)
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

// ---- 创建/编辑（组题器） ----
const editVisible = ref(false)
const formRef = ref()
const form = reactive({ id: null, courseId: null, title: '', window: [], duration: 60, questions: [] })
const formRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  title: [{ required: true, message: '请输入考试标题', trigger: 'blur' }],
  window: [{ required: true, message: '请选择考试窗口', trigger: 'change' }],
  duration: [{ required: true, message: '请设置时长', trigger: 'blur' }]
}
const totalScorePreview = computed(() => form.questions.reduce((s, q) => s + (q.score || 0), 0))

function addQuestion(type) {
  form.questions.push({
    type,
    stem: '',
    options: type === 'CHOICE' ? ['', ''] : undefined,
    answer: type === 'CHOICE' ? 'A' : type === 'JUDGE' ? 'true' : '',
    score: 5
  })
}
async function openEdit(row) {
  if (row) {
    const detail = await getExamDetail(row.id)
    Object.assign(form, {
      id: detail.id,
      courseId: detail.courseId,
      title: detail.title,
      window: [detail.startTime, detail.endTime],
      duration: detail.duration,
      questions: detail.questions.map(q => ({ ...q, options: q.options ? [...q.options] : undefined }))
    })
  } else {
    Object.assign(form, { id: null, courseId: null, title: '', window: [], duration: 60, questions: [] })
    addQuestion('CHOICE')
  }
  editVisible.value = true
}
async function handleSave() {
  await formRef.value.validate()
  if (!form.questions.length) {
    ElMessage.warning('至少需要一道题目')
    return
  }
  saving.value = true
  try {
    const payload = {
      id: form.id,
      courseId: form.courseId,
      title: form.title,
      duration: form.duration,
      startTime: form.window[0],
      endTime: form.window[1],
      questions: form.questions
    }
    if (form.id) {
      await updateExam(form.id, payload)
    } else {
      await createExam(payload)
    }
    ElMessage.success('保存成功')
    editVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除考试「${row.title}」？`, '删除确认', { type: 'warning' })
  await deleteExam(row.id)
  ElMessage.success('删除成功')
  loadData()
}

// ---- 学生 ----
function enterExam(row) {
  router.push(`/study/exam/${row.id}`)
}
const scoresVisible = ref(false)
const myScores = ref([])
async function viewScores(row) {
  myScores.value = await myExamRecords(row.id)
  scoresVisible.value = true
}

// ---- 答卷与批改 ----
const current = ref(null)
const recordsVisible = ref(false)
const recordsLoading = ref(false)
const records = ref([])
const recordsTotal = ref(0)
const recordsQuery = reactive({ pageNum: 1, pageSize: 10 })
function openRecords(row) {
  current.value = row
  recordsQuery.pageNum = 1
  recordsVisible.value = true
  loadRecords()
}
async function loadRecords() {
  recordsLoading.value = true
  try {
    const data = await pageExamRecords(current.value.id, recordsQuery)
    records.value = data.list || []
    recordsTotal.value = data.total || 0
  } finally {
    recordsLoading.value = false
  }
}
const gradeVisible = ref(false)
const grading = ref(null)
const gradeDetail = ref(null)
const essayScoreMap = reactive({})
const gradeComment = ref('')
async function openGrade(row) {
  grading.value = row
  gradeDetail.value = await getRecordDetail(row.id)
  gradeComment.value = row.comment || ''
  Object.keys(essayScoreMap).forEach(k => delete essayScoreMap[k])
  gradeDetail.value.questions.forEach((q, qi) => {
    if (q.type === 'ESSAY') essayScoreMap[qi] = 0
  })
  gradeVisible.value = true
}
function answerText(qi, q) {
  const a = (gradeDetail.value.myAnswers || []).find(x => x.index === qi)
  if (!a || a.answer === '' || a.answer === null) return '（未作答）'
  if (q.type === 'JUDGE') return a.answer === 'true' ? '正确' : '错误'
  return a.answer
}
async function handleGrade() {
  saving.value = true
  try {
    const essayScores = Object.entries(essayScoreMap).map(([index, score]) => ({ index: Number(index), score }))
    await gradeExam({ recordId: grading.value.id, essayScores, comment: gradeComment.value })
    ElMessage.success('批改完成')
    gradeVisible.value = false
    loadRecords()
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
.window-text {
  font-size: 12px;
  line-height: 1.5;
}
.question-list {
  width: 100%;
}
.question-item {
  border: 1px solid var(--color-border, #e5e6eb);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.question-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.q-index {
  font-size: 13px;
  color: var(--color-text-secondary, #4e5969);
}
.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.question-add {
  display: flex;
  align-items: center;
  gap: 8px;
}
.grade-question {
  border-bottom: 1px dashed var(--color-border, #e5e6eb);
  padding: 10px 0;
}
.q-stem {
  font-size: 14px;
  margin-bottom: 6px;
}
.q-answer {
  font-size: 13px;
  color: var(--color-text-secondary, #4e5969);
  margin-bottom: 6px;
  white-space: pre-wrap;
}
.q-score {
  font-size: 13px;
}
</style>
