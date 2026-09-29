<template>
  <div class="my-apply-page">
    <h2>我的申领</h2>

    <el-skeleton v-if="loading" :rows="5" animated />

    <el-empty v-else-if="!applies.length" description="暂无申领记录" :image-size="80" />

    <el-card v-for="apply in applies" :key="apply.id" class="apply-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ apply.activity?.activity_name }}</span>
          <el-tag :type="APPLY_STATUS[apply.apply_status]?.type">
            {{ APPLY_STATUS[apply.apply_status]?.label }}
          </el-tag>
        </div>
      </template>

      <div class="apply-info">
        <p><strong>申领时间：</strong>{{ formatTime(apply.create_time) }}</p>
        <p><strong>收货人：</strong>{{ apply.receiver_snapshot }} {{ apply.phone_snapshot }}</p>
        <p><strong>收货地址：</strong>{{ apply.address_snapshot }}</p>

        <div class="gift-list">
          <strong>申领礼品：</strong>
          <el-tag v-for="item in apply.items" :key="item.id" style="margin-right: 8px">
            {{ item.gift_name_snapshot }} x{{ item.quantity }}
          </el-tag>
        </div>

        <div v-if="apply.apply_status === 2" class="express-info">
          <p><strong>物流公司：</strong>{{ apply.express_company || '-' }}</p>
          <p><strong>快递单号：</strong>{{ apply.express_no || '-' }}</p>
          <p><strong>发货时间：</strong>{{ formatTime(apply.deliver_time) }}</p>
        </div>
      </div>

      <div class="actions" v-if="apply.apply_status === 1">
        <el-button type="primary" @click="goEdit(apply)">修改申领</el-button>
        <el-button type="danger" @click="handleCancel(apply.id)">取消申领</el-button>
      </div>

      <div class="actions" v-if="apply.apply_status === 2">
        <el-button type="success" @click="openSignDialog(apply)">确认签收</el-button>
      </div>
    </el-card>

    <el-dialog v-model="signDialogVisible" title="确认签收" width="500px">
      <el-input v-model="feedback" type="textarea" rows="4" placeholder="如有问题请在此反馈（可选）" />
      <template #footer>
        <el-button @click="signDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSign">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyApplyList, cancelApply } from '@/api/apply'
import { signApply } from '@/api/sign'
import { APPLY_STATUS } from '@/utils/constants'

const router = useRouter()
const applies = ref([])
const loading = ref(true)
const signDialogVisible = ref(false)
const feedback = ref('')
const currentApplyId = ref(null)

onMounted(async () => {
  await loadData()
})

const loadData = async () => {
  try {
    const res = await getMyApplyList()
    applies.value = res.data?.list || []
  } finally {
    loading.value = false
  }
}

const goEdit = (apply) => {
  router.push(`/employee/activity/${apply.activity_id}`)
}

const handleCancel = async (id) => {
  try {
    await ElMessageBox.confirm('确定要取消该申领吗？', '提示', { type: 'warning' })
    await cancelApply(id)
    ElMessage.success('取消成功')
    await loadData()
  } catch {
    // 取消
  }
}

const openSignDialog = (apply) => {
  currentApplyId.value = apply.id
  feedback.value = ''
  signDialogVisible.value = true
}

const handleSign = async () => {
  await signApply(currentApplyId.value, { feedback: feedback.value })
  ElMessage.success('签收成功')
  signDialogVisible.value = false
  await loadData()
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}
</script>

<style scoped>
.my-apply-page h2 {
  margin-bottom: 20px;
}

.apply-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.apply-info p {
  margin: 8px 0;
}

.gift-list {
  margin: 12px 0;
}

.express-info {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.actions {
  margin-top: 16px;
}
</style>
