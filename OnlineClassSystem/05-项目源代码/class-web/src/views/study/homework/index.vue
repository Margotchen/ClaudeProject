<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">作业考试</div>
      <div class="page-desc">{{ desc }}</div>
    </div>

    <BaseCard>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="课后作业" name="homework">
          <HomeworkPanel :course-options="courseOptions" />
        </el-tab-pane>
        <el-tab-pane label="在线考试" name="exam">
          <ExamPanel :course-options="courseOptions" />
        </el-tab-pane>
      </el-tabs>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BaseCard from '../../../components/BaseCard.vue'
import HomeworkPanel from './HomeworkPanel.vue'
import ExamPanel from './ExamPanel.vue'
import { pageCourses } from '../../../api/course'
import { useUserStore } from '../../../store/user'

const userStore = useUserStore()
const activeTab = ref('homework')
const courseOptions = ref([])

const desc = computed(() => {
  const map = {
    ADMIN: '管理全部课程的作业与考试',
    TEACHER: '布置作业、创建考试并批改',
    HEAD_TEACHER: '查看作业布置与考试开展情况',
    STUDENT: '提交作业、参加在线考试'
  }
  return map[userStore.roleCode] || ''
})

onMounted(async () => {
  const data = await pageCourses({ pageNum: 1, pageSize: 100 })
  courseOptions.value = data.list || []
})
</script>
