<template>
  <div v-if="!roomLoaded" class="room-page room-loading">
    <BaseCard class="loading-header"><el-skeleton :rows="1" animated /></BaseCard>
    <BaseCard class="loading-body"><el-skeleton :rows="8" animated /></BaseCard>
  </div>
  <div v-else class="room-page">
    <!-- 顶部栏 -->
    <div class="room-header">
      <el-button :icon="Back" circle @click="goBack" />
      <div class="room-title">
        <span class="live-title">{{ room.liveTitle || '直播教室' }}</span>
        <span class="course-name">{{ room.courseName }} · {{ room.teacherName }}</span>
      </div>
      <el-tag :type="{ 0: 'info', 1: 'danger', 2: 'success' }[room.scheduleStatus]" effect="dark">
        {{ { 0: '未开始', 1: '直播中', 2: '已结束' }[room.scheduleStatus] }}
      </el-tag>
      <el-popover placement="bottom" :width="240" trigger="click">
        <template #reference>
          <span class="online-count clickable">
            <el-icon><User /></el-icon>{{ onlineCount }} 人在线
          </span>
        </template>
        <div class="online-list">
          <div class="online-list-title">在线人员（{{ sortedOnlineUsers.length }}）</div>
          <el-empty v-if="!sortedOnlineUsers.length" description="暂无在线人员" :image-size="60" />
          <div v-for="u in sortedOnlineUsers" :key="u.userId" class="online-item">
            <el-avatar :size="26">{{ (u.realName || '?').slice(0, 1) }}</el-avatar>
            <span class="online-name">{{ u.realName }}</span>
            <el-tag size="small" effect="plain" :type="roleTagType(u.roleCode)">{{ roleName(u.roleCode) }}</el-tag>
          </div>
        </div>
      </el-popover>
      <span v-if="!wsConnected" class="ws-status">连接中断，重连中…</span>
      <template v-if="room.canManage && !readOnly">
        <el-button v-if="room.scheduleStatus === 0" type="danger" :icon="VideoPlay" :loading="actionLoading" @click="handleStart">
          开始直播
        </el-button>
        <el-button v-if="room.scheduleStatus === 1" type="danger" plain :icon="VideoPause" :loading="actionLoading" @click="handleEnd">
          结束直播
        </el-button>
      </template>
    </div>

    <div class="room-body">
      <!-- 视频区 -->
      <div class="video-area">
        <div class="video-box" @mousemove="wakeControls" @mouseleave="scheduleHideControls">
          <!-- 讲师本地预览 / 学生拉流播放共用 video -->
          <video v-show="cameraActive || playerActive" ref="videoRef" class="camera-preview" autoplay :muted="cameraActive" playsinline />
          <div v-show="!cameraActive && !playerActive" class="video-placeholder">
            <template v-if="room.scheduleStatus === 1">
              <el-icon :size="48"><VideoCamera /></el-icon>
              <p>{{ room.srsEnabled ? (playerRetrying ? '等待讲师推流…' : '正在接入直播流…') : '视频流服务未接入（待安装 Docker + SRS）' }}</p>
              <p v-if="!room.srsEnabled" class="sub-tip">互动功能已可用：弹幕 / 提问 / 举手 / 投票</p>
            </template>
            <template v-else-if="room.scheduleStatus === 2">
              <el-icon :size="48"><VideoPause /></el-icon>
              <p>直播已结束</p>
            </template>
            <template v-else>
              <el-icon :size="48"><AlarmClock /></el-icon>
              <p>直播尚未开始</p>
              <p class="sub-tip">计划开播：{{ room.startTime }}（{{ room.duration }} 分钟）</p>
            </template>
          </div>
          <!-- 弹幕悬浮层 -->
          <div class="danmaku-overlay">
            <div
              v-for="d in flyingDanmakus"
              :key="d.key"
              class="danmaku-item"
              :style="{ top: d.top + '%' }"
              @animationend="removeDanmaku(d.key)"
            >
              {{ d.text }}
            </div>
          </div>
          <!-- 讲师直播控制台（半透明悬浮，静止自动淡出） -->
          <div
            v-if="room.canManage && !readOnly && room.scheduleStatus === 1"
            class="media-controls"
            :class="{ faded: controlsFaded }"
          >
            <el-button :type="micOn ? 'primary' : 'info'" :icon="Microphone" circle @click="toggleMic" />
            <el-button :type="camOn ? 'primary' : 'info'" :icon="VideoCamera" circle @click="toggleCam" />
            <el-button
              v-if="room.srsEnabled"
              :type="screenSharing ? 'warning' : 'primary'"
              :icon="Monitor"
              circle
              @click="toggleScreen"
            />
            <span class="control-tip">
              {{ screenSharing ? '屏幕共享中' : room.srsEnabled ? '摄像头推流中' : '本地预览（SRS 未接入，学生端看不到画面）' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 互动区 -->
      <div class="interact-area">
        <el-tabs v-model="activeTab" class="interact-tabs">
          <el-tab-pane label="互动" name="chat">
            <template #label>
              互动
              <el-badge v-if="raiseList.length && room.canManage" :value="raiseList.length" class="tab-badge" />
            </template>
            <div ref="chatListRef" class="chat-list">
              <div v-for="m in chatMessages" :key="m.key" class="chat-item" :class="{ mine: m.userId === userStore.userInfo?.id }">
                <div class="chat-meta">
                  <el-tag v-if="m.msgType === 'QUESTION'" type="warning" size="small" effect="plain">提问</el-tag>
                  <el-tag v-else-if="m.msgType === 'HAND_RAISE'" type="success" size="small" effect="plain">举手</el-tag>
                  <el-tag v-else-if="m.msgType === 'SYSTEM'" type="info" size="small" effect="plain">系统</el-tag>
                  <span class="chat-user">{{ m.realName }}</span>
                  <span class="chat-time">{{ shortTime(m.createTime) }}</span>
                </div>
                <div class="chat-content">{{ m.content }}</div>
              </div>
              <el-empty v-if="!chatMessages.length" description="暂无互动消息" :image-size="60" />
            </div>
            <div v-if="!readOnly && room.scheduleStatus === 1" class="chat-input">
              <el-radio-group v-model="chatMode" size="small">
                <el-radio-button value="DANMAKU">弹幕</el-radio-button>
                <el-radio-button value="QUESTION">提问</el-radio-button>
              </el-radio-group>
              <div class="input-row">
                <el-input
                  v-model="chatInput"
                  :placeholder="chatMode === 'DANMAKU' ? '发个弹幕吧…' : '向讲师提问…'"
                  maxlength="200"
                  @keyup.enter="sendChat"
                />
                <el-button type="primary" :disabled="!chatInput.trim() || !wsConnected" @click="sendChat">发送</el-button>
              </div>
              <div class="raise-row">
                <el-button
                  :type="myRaised ? 'warning' : 'success'"
                  size="small"
                  :icon="Pointer"
                  :disabled="!wsConnected"
                  @click="toggleRaise"
                >
                  {{ myRaised ? '取消举手' : '举手发言' }}
                </el-button>
              </div>
            </div>
            <div v-else-if="!readOnly && room.scheduleStatus === 2" class="chat-input ended-tip">
              直播已结束，互动通道已关闭
            </div>
          </el-tab-pane>

          <el-tab-pane label="投票" name="vote">
            <div class="vote-panel">
              <div v-if="room.canManage && !readOnly && room.scheduleStatus === 1" class="vote-actions">
                <el-button type="primary" size="small" :icon="Plus" :disabled="!!activeVote" @click="voteDialogVisible = true">
                  发起投票
                </el-button>
                <el-button v-if="activeVote" type="danger" size="small" plain @click="endVote">结束投票</el-button>
              </div>
              <div v-if="!voteList.length" class="vote-empty">
                <el-empty description="暂无投票" :image-size="60" />
              </div>
              <div v-for="vote in voteList" :key="vote.voteId" class="vote-card">
                <div class="vote-title">
                  {{ vote.title }}
                  <el-tag :type="vote.ended ? 'info' : 'danger'" size="small">{{ vote.ended ? '已结束' : '进行中' }}</el-tag>
                </div>
                <template v-if="!vote.ended && vote.myChoice === null && !readOnly && !room.canManage && room.scheduleStatus === 1">
                  <el-radio-group v-model="vote.selected" class="vote-options">
                    <el-radio v-for="(opt, i) in vote.options" :key="i" :value="i">{{ opt }}</el-radio>
                  </el-radio-group>
                  <el-button type="primary" size="small" :disabled="vote.selected === null" @click="submitVote(vote)">
                    提交
                  </el-button>
                </template>
                <template v-else>
                  <div v-for="(opt, i) in vote.options" :key="i" class="vote-result-row">
                    <span class="opt-label">{{ opt }}</span>
                    <el-progress
                      :percentage="vote.total ? Math.round(((vote.counts[i] || 0) / vote.total) * 100) : 0"
                      :stroke-width="14"
                      style="flex: 1"
                    />
                    <span class="opt-count">{{ vote.counts[i] || 0 }} 票</span>
                    <el-icon v-if="vote.myChoice === i" color="var(--color-primary)"><CircleCheckFilled /></el-icon>
                  </div>
                  <div class="vote-total">共 {{ vote.total }} 人参与</div>
                </template>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane v-if="room.canManage && !readOnly" name="raise">
            <template #label>
              举手<el-badge v-if="raiseList.length" :value="raiseList.length" class="tab-badge" />
            </template>
            <div class="raise-panel">
              <el-empty v-if="!raiseList.length" description="暂无学生举手" :image-size="60" />
              <div v-for="r in raiseList" :key="r.userId" class="raise-item">
                <div>
                  <span class="raise-name">{{ r.realName }}</span>
                  <span class="raise-time">{{ shortTime(r.createTime) }}</span>
                </div>
                <el-button size="small" type="success" plain @click="dismissRaise(r)">完成连线</el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 发起投票对话框 -->
    <el-dialog v-model="voteDialogVisible" title="发起投票" width="440px">
      <el-form label-width="80px">
        <el-form-item label="投票标题" required>
          <el-input v-model="voteForm.title" maxlength="50" placeholder="如：本节课内容听懂了吗？" />
        </el-form-item>
        <el-form-item v-for="(opt, i) in voteForm.options" :key="i" :label="`选项${i + 1}`" required>
          <div class="opt-input-row">
            <el-input v-model="voteForm.options[i]" maxlength="30" />
            <el-button
              v-if="voteForm.options.length > 2"
              :icon="Delete"
              circle
              size="small"
              @click="voteForm.options.splice(i, 1)"
            />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button v-if="voteForm.options.length < 6" :icon="Plus" size="small" @click="voteForm.options.push('')">
            添加选项
          </el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="voteDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!voteFormValid" @click="startVote">发起</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Back, User, VideoPlay, VideoPause, VideoCamera, AlarmClock, Pointer, Plus, Delete, CircleCheckFilled,
  Microphone, Monitor
} from '@element-plus/icons-vue'
import { getRoomInfo, startLive, endLive, pageInteractions, getVoteResult, getPushUrl } from '../../../api/live'
import { heartbeat } from '../../../api/stats'
import { LiveSocket } from '../../../utils/websocket'
import { WhipPublisher, WhepPlayer } from '../../../utils/webrtc'
import { useUserStore } from '../../../store/user'
import BaseCard from '../../../components/BaseCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const scheduleId = route.params.scheduleId
// 监督模式：管理员/班主任进入时只读
const readOnly = computed(() => route.query.mode === 'monitor')

const room = ref({})
const roomLoaded = ref(false)
const onlineCount = ref(0)
const onlineUsers = ref([])

// 角色展示：讲师/班主任/管理员排前
const ROLE_ORDER = { TEACHER: 0, HEAD_TEACHER: 1, ADMIN: 2, STUDENT: 3 }
const ROLE_NAMES = { TEACHER: '讲师', HEAD_TEACHER: '班主任', ADMIN: '管理员', STUDENT: '学生' }
const ROLE_TAG_TYPES = { TEACHER: 'danger', HEAD_TEACHER: 'warning', ADMIN: 'primary', STUDENT: 'success' }
const sortedOnlineUsers = computed(() =>
  [...onlineUsers.value].sort((a, b) => (ROLE_ORDER[a.roleCode] ?? 9) - (ROLE_ORDER[b.roleCode] ?? 9))
)
const roleName = (code) => ROLE_NAMES[code] || code
const roleTagType = (code) => ROLE_TAG_TYPES[code] || 'info'
const actionLoading = ref(false)
const wsConnected = ref(false)
const activeTab = ref('chat')

// 互动消息
const chatMessages = ref([])
const chatListRef = ref()
const chatMode = ref('DANMAKU')
const chatInput = ref('')
let msgKey = 0

// 举手
const raiseList = ref([])
const myRaised = ref(false)

// 投票
const votes = ref(new Map())
const voteDialogVisible = ref(false)
const voteForm = reactive({ title: '', options: ['', ''] })
const voteFormValid = computed(
  () => voteForm.title.trim() && voteForm.options.every((o) => o.trim()) && voteForm.options.length >= 2
)
const voteList = computed(() => [...votes.value.values()].reverse())
const activeVote = computed(() => voteList.value.find((v) => !v.ended))

// 视频：推流（讲师）/ 拉流（学生）
const videoRef = ref()
const cameraActive = ref(false)
const playerActive = ref(false)
const playerRetrying = ref(false)
const micOn = ref(true)
const camOn = ref(true)
const screenSharing = ref(false)
let publisher = null
let player = null
let playerRetryTimer = null

// 讲师控制台自动淡出（静止 3s 隐藏，鼠标移动唤醒）
const controlsFaded = ref(false)
let controlsHideTimer = null

function wakeControls() {
  controlsFaded.value = false
  scheduleHideControls()
}

function scheduleHideControls() {
  clearTimeout(controlsHideTimer)
  controlsHideTimer = setTimeout(() => {
    controlsFaded.value = true
  }, 3000)
}

// 弹幕悬浮
const flyingDanmakus = ref([])
let danmakuKey = 0

let socket = null

// 学习时长心跳（学生观看直播，每 15s 上报一次）
const HEARTBEAT_INTERVAL = 15000
let heartbeatTimer = null

function startHeartbeat() {
  if (heartbeatTimer || userStore.roleCode !== 'STUDENT' || readOnly.value) return
  heartbeatTimer = setInterval(() => {
    if (room.value.scheduleStatus === 1 && room.value.courseId) {
      heartbeat({ courseId: room.value.courseId, scene: 'LIVE', seconds: HEARTBEAT_INTERVAL / 1000 })
        .catch(() => {})
    }
  }, HEARTBEAT_INTERVAL)
}

function stopHeartbeat() {
  clearInterval(heartbeatTimer)
  heartbeatTimer = null
}

// ---------- 初始化 ----------

onMounted(async () => {
  await loadRoom()
  await loadHistory()
  connectWs()
  startHeartbeat()
})

onBeforeUnmount(() => {
  stopHeartbeat()
  stopMedia()
  clearTimeout(controlsHideTimer)
  socket?.close()
})

async function loadRoom() {
  room.value = await getRoomInfo(scheduleId)
  roomLoaded.value = true
  onlineCount.value = room.value.onlineCount || 0
  if (room.value.scheduleStatus === 1) {
    scheduleHideControls()
    if (room.value.canManage && !readOnly.value) {
      startPublish()
    } else {
      startPlay()
    }
  }
}

async function loadHistory() {
  const data = await pageInteractions({ scheduleId, pageNum: 1, pageSize: 200 })
  const list = (data.list || []).reverse()
  const myId = userStore.userInfo?.id
  for (const m of list) {
    if (m.msgType === 'DANMAKU' || m.msgType === 'QUESTION') {
      pushChat(m)
    } else if (m.msgType === 'HAND_RAISE') {
      if (m.userId === myId) myRaised.value = true
      raiseList.value.push(m)
    } else if (m.msgType === 'VOTE_START') {
      const extra = safeParse(m.extra)
      votes.value.set(m.bizId, {
        voteId: m.bizId,
        title: extra?.title || m.content,
        options: extra?.options || [],
        counts: [],
        total: 0,
        ended: false,
        myChoice: null,
        selected: null
      })
    } else if (m.msgType === 'VOTE_END') {
      const vote = votes.value.get(m.bizId)
      if (vote) vote.ended = true
    } else if (m.msgType === 'VOTE_SUBMIT' && m.userId === myId) {
      const vote = votes.value.get(m.bizId)
      const idx = safeParse(m.extra)?.optionIndex
      if (vote && idx !== undefined) vote.myChoice = idx
    }
  }
  // 补齐每个投票的实时统计
  for (const vote of votes.value.values()) {
    refreshVote(vote.voteId)
  }
  scrollChatToBottom()
}

function connectWs() {
  socket = new LiveSocket(scheduleId)
  socket
    .on('__open', () => (wsConnected.value = true))
    .on('__close', () => (wsConnected.value = false))
    .on('DANMAKU', (data) => {
      pushChat(data)
      flyDanmaku(`${data.realName}：${data.content}`)
      scrollChatToBottom()
    })
    .on('QUESTION', (data) => {
      pushChat(data)
      scrollChatToBottom()
    })
    .on('HAND_RAISE', (data) => {
      pushChat({ ...data, content: '举手申请发言' })
      if (data.userId === userStore.userInfo?.id) myRaised.value = true
      if (!raiseList.value.some((r) => r.userId === data.userId)) raiseList.value.push(data)
      scrollChatToBottom()
    })
    .on('HAND_RAISE_CANCEL', (data) => {
      raiseList.value = raiseList.value.filter((r) => r.userId !== data.userId)
      if (data.userId === userStore.userInfo?.id) myRaised.value = false
    })
    .on('VOTE_START', (data) => {
      votes.value.set(data.voteId, {
        voteId: data.voteId,
        title: data.title,
        options: data.options,
        counts: data.options.map(() => 0),
        total: 0,
        ended: false,
        myChoice: null,
        selected: null
      })
      if (!room.value.canManage) {
        ElNotification({ title: '课堂投票', message: data.title, type: 'primary', duration: 5000 })
      }
    })
    .on('VOTE_RESULT', (data) => updateVote(data))
    .on('VOTE_END', (data) => {
      updateVote(data)
      const vote = votes.value.get(data.voteId)
      if (vote) vote.ended = true
    })
    .on('ONLINE', (data) => {
      onlineCount.value = data.count
      onlineUsers.value = data.users || []
    })
    .on('LIVE_STATUS', (data) => {
      room.value.scheduleStatus = data.status
      if (data.status === 1) {
        if (room.value.canManage && !readOnly.value) {
          startPublish()
        } else {
          startPlay()
        }
        ElMessage.success('直播已开始')
      } else if (data.status === 2) {
        stopMedia()
        ElMessage.info('直播已结束')
      }
    })
    .on('ERROR', (data) => ElMessage.error(data.message))
  socket.connect()
}

// ---------- 直播控制 ----------

async function handleStart() {
  await ElMessageBox.confirm('确定开始直播吗？学生端将收到开播通知。', '开始直播', { type: 'warning' })
  actionLoading.value = true
  try {
    room.value = await startLive(scheduleId)
    startPublish()
    ElMessage.success('直播已开始')
  } finally {
    actionLoading.value = false
  }
}

async function handleEnd() {
  await ElMessageBox.confirm('确定结束本场直播吗？', '结束直播', { type: 'warning' })
  actionLoading.value = true
  try {
    await endLive(scheduleId)
    stopMedia()
    room.value.scheduleStatus = 2
    ElMessage.success('直播已结束')
  } finally {
    actionLoading.value = false
  }
}

// ---------- 媒体流（WHIP 推流 / WHEP 拉流） ----------

/** 讲师：开始推流（SRS 可用走 WHIP，否则本地预览兜底） */
async function startPublish() {
  stopPublish()
  if (room.value.srsEnabled) {
    try {
      const pushUrl = await getPushUrl(scheduleId)
      publisher = new WhipPublisher(pushUrl)
      const stream = await publisher.startCamera()
      await nextTick()
      if (videoRef.value) videoRef.value.srcObject = stream
      cameraActive.value = true
      micOn.value = true
      camOn.value = true
      return
    } catch (e) {
      console.error('WHIP 推流失败', e)
      ElMessage.error('推流失败：' + (e.name === 'NotAllowedError' ? '请授权摄像头/麦克风权限' : e.message))
      publisher = null
    }
  }
  // 兜底：仅本地预览
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    await nextTick()
    if (videoRef.value) videoRef.value.srcObject = stream
    publisher = {
      stop: () => stream.getTracks().forEach((t) => t.stop()),
      toggleVideo: (enabled) => stream.getVideoTracks().forEach((t) => (t.enabled = enabled))
    }
    cameraActive.value = true
  } catch (e) {
    ElMessage.warning('无法访问摄像头，仅展示互动画面')
  }
}

/** 学生/监督：WHEP 拉流播放，失败自动重试 */
async function startPlay() {
  if (!room.value.srsEnabled) return
  stopPlay()
  playerRetrying.value = true
  try {
    const pullUrl = room.value.pullUrl
    player = new WhepPlayer(pullUrl, videoRef.value)
    player.onStateChange = (state) => {
      if (state === 'playing') {
        playerActive.value = true
        playerRetrying.value = false
      } else if (state === 'failed') {
        playerActive.value = false
        schedulePlayRetry()
      }
    }
    await player.start()
  } catch (e) {
    // 讲师尚未推流，稍后重试
    schedulePlayRetry()
  }
}

function schedulePlayRetry() {
  if (room.value.scheduleStatus !== 1 || playerActive.value) return
  clearTimeout(playerRetryTimer)
  playerRetryTimer = setTimeout(startPlay, 5000)
}

function toggleMic() {
  micOn.value = !micOn.value
  publisher?.toggleAudio?.(micOn.value)
}

function toggleCam() {
  camOn.value = !camOn.value
  publisher?.toggleVideo?.(camOn.value)
}

async function toggleScreen() {
  if (!publisher || !publisher.startScreen) return
  try {
    if (screenSharing.value) {
      const stream = await publisher.backToCamera()
      if (videoRef.value) videoRef.value.srcObject = stream
      screenSharing.value = false
    } else {
      const stream = await publisher.startScreen()
      if (videoRef.value) videoRef.value.srcObject = stream
      screenSharing.value = true
      publisher.onScreenEnd = async () => {
        const camStream = await publisher.backToCamera()
        if (videoRef.value) videoRef.value.srcObject = camStream
        screenSharing.value = false
      }
    }
  } catch (e) {
    if (e.name !== 'NotAllowedError') ElMessage.error('屏幕共享失败：' + e.message)
  }
}

function stopPublish() {
  publisher?.stop?.()
  publisher = null
  cameraActive.value = false
  screenSharing.value = false
}

function stopPlay() {
  clearTimeout(playerRetryTimer)
  player?.stop()
  player = null
  playerActive.value = false
  playerRetrying.value = false
}

function stopMedia() {
  stopPublish()
  stopPlay()
  if (videoRef.value) videoRef.value.srcObject = null
}

// ---------- 互动 ----------

function sendChat() {
  const content = chatInput.value.trim()
  if (!content) return
  if (socket.send({ type: chatMode.value, content })) {
    chatInput.value = ''
  } else {
    ElMessage.warning('连接已断开，请稍候重试')
  }
}

function toggleRaise() {
  if (myRaised.value) {
    socket.send({ type: 'HAND_RAISE_CANCEL' })
  } else {
    socket.send({ type: 'HAND_RAISE' })
  }
}

function dismissRaise(r) {
  socket.send({ type: 'HAND_RAISE_CANCEL', extra: { targetUserId: r.userId } })
}

function startVote() {
  const options = voteForm.options.map((o) => o.trim())
  socket.send({ type: 'VOTE_START', content: voteForm.title.trim(), extra: { options } })
  voteDialogVisible.value = false
  voteForm.title = ''
  voteForm.options = ['', '']
}

function submitVote(vote) {
  socket.send({ type: 'VOTE_SUBMIT', bizId: vote.voteId, extra: { optionIndex: vote.selected } })
  vote.myChoice = vote.selected
}

function endVote() {
  if (activeVote.value) {
    socket.send({ type: 'VOTE_END', bizId: activeVote.value.voteId })
  }
}

async function refreshVote(voteId) {
  try {
    const data = await getVoteResult(voteId)
    updateVote(data)
    const vote = votes.value.get(voteId)
    if (vote) vote.ended = data.ended
  } catch (e) {
    // 投票可能已被清理，忽略
  }
}

function updateVote(data) {
  const vote = votes.value.get(data.voteId)
  if (vote) {
    vote.counts = data.counts
    vote.total = data.total
  }
}

// ---------- 工具 ----------

function pushChat(m) {
  chatMessages.value.push({ ...m, key: ++msgKey })
  if (chatMessages.value.length > 300) chatMessages.value.shift()
}

function flyDanmaku(text) {
  const key = ++danmakuKey
  flyingDanmakus.value.push({ key, text, top: 8 + Math.random() * 55 })
}

function removeDanmaku(key) {
  flyingDanmakus.value = flyingDanmakus.value.filter((d) => d.key !== key)
}

function scrollChatToBottom() {
  nextTick(() => {
    if (chatListRef.value) chatListRef.value.scrollTop = chatListRef.value.scrollHeight
  })
}

function shortTime(t) {
  return t ? t.slice(11, 16) : ''
}

function safeParse(str) {
  try {
    return str ? JSON.parse(str) : null
  } catch {
    return null
  }
}

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
/* 在线人员弹层 */
.online-list {
  max-height: 320px;
  overflow-y: auto;

  .online-list-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 8px;
  }

  .online-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 4px;
    border-radius: var(--radius-base);
    transition: all 0.3s ease;

    &:hover {
      background: var(--color-primary-light);
    }

    .online-name {
      flex: 1;
      font-size: 13px;
      color: var(--color-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.room-loading {  .loading-header {
    flex-shrink: 0;
  }

  .loading-body {
    flex: 1;
  }
}

.room-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .room-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    background: var(--color-bg-card);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-card);

    .room-title {
      flex: 1;
      min-width: 0;

      .live-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin-right: 10px;
      }

      .course-name {
        font-size: 13px;
        color: var(--color-text-secondary);
      }
    }

    .online-count {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--color-text-secondary);

      &.clickable {
        cursor: pointer;
        padding: 4px 8px;
        border-radius: var(--radius-base);
        transition: all 0.3s ease;

        &:hover {
          color: var(--color-primary);
          background: var(--color-primary-light);
        }
      }
    }

    .ws-status {      font-size: 12px;
      color: var(--color-warning);
    }
  }

  .room-body {
    flex: 1;
    display: flex;
    gap: 12px;
    min-height: 0;

    .video-area {
      flex: 1;
      min-width: 0;

      .video-box {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
        background: #0d0d0d;
        border-radius: var(--radius-base);
        overflow: hidden;

        .camera-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.75);

          .sub-tip {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.45);
          }
        }

        .danmaku-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;

          .danmaku-item {
            position: absolute;
            left: 100%;
            white-space: nowrap;
            color: #fff;
            font-size: 15px;
            text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
            animation: danmaku-fly 8s linear forwards;
          }

          @keyframes danmaku-fly {
            to { transform: translateX(calc(-100vw - 100%)); }
          }
        }

        /* 讲师控制台：半透明悬浮胶囊，静止自动淡出 */
        .media-controls {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 24px;
          transition: opacity 0.3s ease;

          &.faded {
            opacity: 0;
            pointer-events: none;
          }

          .control-tip {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.75);
          }

          /* 触屏设备常驻显示 */
          @media (hover: none) {
            opacity: 1;
            pointer-events: auto;
          }
        }
      }
    }

    .interact-area {
      width: 340px;
      flex-shrink: 0;
      background: var(--color-bg-card);
      border-radius: var(--radius-base);
      box-shadow: var(--shadow-card);
      padding: 8px 14px 14px;
      display: flex;
      flex-direction: column;
      min-height: 0;

      .interact-tabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;

        :deep(.el-tabs__content) {
          flex: 1;
          min-height: 0;

          .el-tab-pane {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
        }

        .tab-badge {
          margin-left: 4px;
          vertical-align: 2px;
        }
      }

      .chat-list {
        flex: 1;
        overflow-y: auto;
        min-height: 200px;
        padding: 4px 0;

        .chat-item {
          padding: 6px 8px;
          border-radius: 6px;
          margin-bottom: 4px;

          &.mine {
            background: var(--color-primary-light);
          }

          .chat-meta {
            display: flex;
            align-items: center;
            gap: 6px;

            .chat-user {
              font-size: 12px;
              font-weight: 600;
              color: var(--color-text-primary);
            }

            .chat-time {
              font-size: 11px;
              color: var(--color-text-placeholder);
            }
          }

          .chat-content {
            margin-top: 2px;
            font-size: 13px;
            color: var(--color-text-secondary);
            word-break: break-all;
          }
        }
      }

      .chat-input {
        border-top: 1px solid var(--color-border);
        padding-top: 10px;

        &.ended-tip {
          text-align: center;
          font-size: 12px;
          color: var(--color-text-placeholder);
          padding: 12px 0;
        }

        .input-row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .raise-row {
          margin-top: 8px;
          display: flex;
          justify-content: flex-end;
        }
      }

      .vote-panel {
        flex: 1;
        overflow-y: auto;

        .vote-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }

        .vote-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-base);
          padding: 12px;
          margin-bottom: 10px;

          .vote-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }

          .vote-options {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 10px;
          }

          .vote-result-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;

            .opt-label {
              width: 70px;
              font-size: 12px;
              color: var(--color-text-secondary);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .opt-count {
              font-size: 12px;
              color: var(--color-text-placeholder);
              width: 40px;
              text-align: right;
            }
          }

          .vote-total {
            margin-top: 6px;
            font-size: 12px;
            color: var(--color-text-placeholder);
          }
        }
      }

      .raise-panel {
        flex: 1;
        overflow-y: auto;

        .raise-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 8px;
          border-bottom: 1px solid var(--color-border);

          .raise-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-primary);
            margin-right: 8px;
          }

          .raise-time {
            font-size: 12px;
            color: var(--color-text-placeholder);
          }
        }
      }
    }
  }

  .opt-input-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }
}

@media (max-width: 1366px) {
  .room-page .room-body {
    flex-direction: column;

    .interact-area {
      width: 100%;
      max-height: 320px;
    }
  }
}
</style>
