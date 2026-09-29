<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">课程录播</div>
      <div class="page-desc">{{ canManage ? '管理直播自动生成的录播视频' : '回放已结束课程的录播视频' }}</div>
    </div>

    <BaseCard>
      <div class="toolbar">
        <el-select v-model="query.courseId" placeholder="按课程筛选" clearable filterable style="width: 220px">
          <el-option v-for="c in courseOptions" :key="c.id" :label="c.courseName" :value="c.id" />
        </el-select>
        <el-select v-if="canManage" v-model="query.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="已上架" :value="1" />
          <el-option label="已下架" :value="0" />
        </el-select>
        <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </div>

      <el-skeleton v-if="loading && !tableData.length" :rows="5" animated />
      <el-table v-else v-loading="loading" :data="tableData" stripe>
        <template #empty><el-empty description="暂无录播视频" :image-size="80" /></template>
        <el-table-column prop="title" label="录播标题" min-width="170" show-overflow-tooltip />
        <el-table-column prop="courseName" label="所属课程" min-width="130" show-overflow-tooltip />
        <el-table-column prop="teacherName" label="讲师" width="100" />
        <el-table-column label="时长" width="100" align="center">
          <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column label="大小" width="90" align="center">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="createTime" label="生成时间" width="170" />
        <el-table-column v-if="canManage" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '已上架' : '已下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="canManage ? 200 : 100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="VideoPlay" @click="play(row)">播放</el-button>
            <template v-if="canManage">
              <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
                {{ row.status === 1 ? '下架' : '上架' }}
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
    </BaseCard>

    <!-- 播放器 -->
    <el-dialog
      v-model="playerVisible"
      :title="current?.title || '录播回放'"
      width="860px"
      destroy-on-close
      @close="stopPlay"
    >
      <video
        v-if="playerVisible"
        ref="videoRef"
        :src="playerUrl"
        class="playback-player"
        controls
        autoplay
        controlslist="nodownload"
        @timeupdate="onTimeUpdate"
      />
      <div class="player-tip">支持倍速播放与进度拖拽</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, VideoPlay } from '@element-plus/icons-vue'
import BaseCard from '../../../components/BaseCard.vue'
import { pagePlayback, updatePlaybackStatus, deletePlayback, playbackFileUrl } from '../../../api/live'
import { heartbeat } from '../../../api/stats'
import { pageCourses } from '../../../api/course'
import { useUserStore } from '../../../store/user'

const userStore = useUserStore()
const canManage = computed(() => ['ADMIN', 'TEACHER'].includes(userStore.roleCode))

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const courseOptions = ref([])
const query = reactive({ pageNum: 1, pageSize: 10, courseId: null, status: null })

const playerVisible = ref(false)
const playerUrl = ref('')
const current = ref(null)
const videoRef = ref(null)

// 录播观看时长心跳：timeupdate 累计 delta，每满 15s 上报一次
const HEARTBEAT_THRESHOLD = 15
let watchedSeconds = 0
let lastTime = 0

function onTimeUpdate() {
  const video = videoRef.value
  if (!video || video.paused) return
  const delta = video.currentTime - lastTime
  lastTime = video.currentTime
  // 拖拽进度会产生大跳变，只累计正常播放区间（0~2s）
  if (delta > 0 && delta <= 2) watchedSeconds += delta
  if (watchedSeconds >= HEARTBEAT_THRESHOLD) {
    const seconds = Math.floor(watchedSeconds)
    watchedSeconds -= seconds
    if (current.value?.courseId && userStore.roleCode === 'STUDENT') {
      heartbeat({ courseId: current.value.courseId, scene: 'PLAYBACK', seconds }).catch(() => {})
    }
  }
}

function flushHeartbeat() {
  const seconds = Math.floor(watchedSeconds)
  watchedSeconds = 0
  lastTime = 0
  if (seconds > 0 && current.value?.courseId && userStore.roleCode === 'STUDENT') {
    heartbeat({ courseId: current.value.courseId, scene: 'PLAYBACK', seconds }).catch(() => {})
  }
}

async function loadData() {
  loading.value = true
  try {
    const data = await pagePlayback(query)
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.courseId = null
  query.status = null
  query.pageNum = 1
  loadData()
}

function play(row) {
  current.value = row
  playerUrl.value = playbackFileUrl(row.id)
  playerVisible.value = true
}

function stopPlay() {
  flushHeartbeat()
  playerUrl.value = ''
  current.value = null
}

async function toggleStatus(row) {
  const target = row.status === 1 ? 0 : 1
  await updatePlaybackStatus(row.id, target)
  ElMessage.success(target === 1 ? '已上架' : '已下架')
  loadData()
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除录播「${row.title}」吗？录制文件将一并删除。`, '警告', { type: 'warning' })
  await deletePlayback(row.id)
  ElMessage.success('删除成功')
  loadData()
}

function formatDuration(seconds) {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
}

function formatSize(bytes) {
  if (!bytes) return '-'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
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

.playback-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--radius-base);
}

.player-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-placeholder);
  text-align: center;
}
</style>
