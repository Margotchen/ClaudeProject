<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">{{ exam?.title || '在线考试' }}</div>
      <div class="page-desc">总分 {{ exam?.totalScore }} 分 · 时长 {{ exam?.duration }} 分钟</div>
    </div>

    <div v-if="started" class="exam-timer" :class="{ urgent: remaining <= 60 }">
      <el-icon><Timer /></el-icon>
      剩余时间 {{ formatRemaining }}
    </div>

    <BaseCard v-loading="loading">
      <template v-if="!started">
        <el-result icon="info" title="考试须知" :sub-title="noticeText">
          <template #extra>
            <el-button type="primary" size="large" :loading="starting" @click="handleStart">开始考试</el-button>
            <el-button size="large" @click="goBack">返回</el-button>
          </template>
        </el-result>
      </template>

      <template v-else>
        <div v-for="(q, qi) in exam.questions" :key="qi" class="question-block">
          <div class="q-title">
            <el-tag size="small" :type="{ CHOICE: 'primary', JUDGE: 'warning', ESSAY: 'success' }[q.type]">
              {{ { CHOICE: '选择题', JUDGE: '判断题', ESSAY: '简答题' }[q.type] }}
            </el-tag>
            <span>第 {{ qi + 1 }} 题（{{ q.score }}分）</span>
          </div>
          <div class="q-stem">{{ q.stem }}</div>
          <el-radio-group v-if="q.type === 'CHOICE'" v-model="answers[qi]" class="q-input">
            <el-radio v-for="(opt, oi) in q.options" :key="oi" :value="String.fromCharCode(65 + oi)">
              {{ String.fromCharCode(65 + oi) }}. {{ opt }}
            </el-radio>
          </el-radio-group>
          <el-radio-group v-else-if="q.type === 'JUDGE'" v-model="answers[qi]" class="q-input">
            <el-radio value="true">正确</el-radio>
            <el-radio value="false">错误</el-radio>
          </el-radio-group>
          <el-input
            v-else
            v-model="answers[qi]"
            type="textarea"
            :rows="4"
            maxlength="2000"
            show-word-limit
            placeholder="请输入答案"
            class="q-input"
          />
        </div>

        <div class="submit-bar">
          <el-button size="large" @click="goBack">暂不提交</el-button>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">交卷</el-button>
        </div>
      </template>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Timer } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { startExam, submitExam, getExamDetail } from '../../../api/homework'

const route = useRoute()
const router = useRouter()
const examId = route.params.examId

const loading = ref(false)
const starting = ref(false)
const submitting = ref(false)
const started = ref(false)
const exam = ref(null)
const recordId = ref(null)
const answers = reactive({})
const remaining = ref(0)
let timer = null

const noticeText = computed(() => {
  if (!exam.value) return ''
  return `考试窗口：${exam.value.startTime} 至 ${exam.value.endTime}；交卷后客观题立即判分，简答题由讲师批改`
})
const formatRemaining = computed(() => {
  const s = Math.max(0, remaining.value)
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

async function handleStart() {
  starting.value = true
  try {
    const data = await startExam(examId)
    exam.value = data
    recordId.value = data.recordId
    remaining.value = data.remainingSeconds
    started.value = true
    startTimer()
  } finally {
    starting.value = false
  }
}

function startTimer() {
  timer = setInterval(() => {
    remaining.value--
    if (remaining.value <= 0) {
      clearInterval(timer)
      ElMessageBox.alert('考试时间已到，系统将自动交卷', '时间到', { type: 'warning' })
        .finally(() => doSubmit(true))
    }
  }, 1000)
}

async function handleSubmit() {
  const unanswered = exam.value.questions.filter((_, i) => !answers[i] && answers[i] !== 0).length
  await ElMessageBox.confirm(
    unanswered > 0 ? `还有 ${unanswered} 道题未作答，确认交卷？` : '确认交卷？',
    '交卷确认',
    { type: 'warning' }
  )
  doSubmit(false)
}

async function doSubmit(auto) {
  if (submitting.value) return
  submitting.value = true
  try {
    const payload = {
      recordId: recordId.value,
      answers: Object.entries(answers).map(([index, answer]) => ({ index: Number(index), answer: String(answer ?? '') }))
    }
    await submitExam(payload)
    ElMessage.success(auto ? '已自动交卷' : '交卷成功')
    router.replace('/study/homework')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/study/homework')
}

onMounted(async () => {
  // 进入页面即拉取题目（学生视角已剥离答案），点击开始后才开始计时
  loading.value = true
  try {
    exam.value = await getExamDetail(examId)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.exam-timer {
  position: sticky;
  top: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin: 0 auto 12px;
  padding: 8px 20px;
  border-radius: 20px;
  background: var(--color-bg-card, #fff);
  box-shadow: var(--shadow-card);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-primary, #4080ff);
}
.exam-timer.urgent {
  color: var(--color-danger, #f53f3f);
}
.question-block {
  border-bottom: 1px dashed var(--color-border, #e5e6eb);
  padding: 16px 0;
}
.q-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}
.q-stem {
  font-size: 15px;
  margin-bottom: 12px;
  white-space: pre-wrap;
}
.q-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}
.q-input :deep(.el-radio) {
  margin-right: 0;
  height: auto;
  white-space: normal;
}
.submit-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
</style>
