<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrderLogisticsTraceAPI } from '@/apis/order'
import { formatDateTime } from '@/utils/datetime'

interface LogisticsTraceItem {
  id: number
  orderId: number
  content: string
  createTime: string
}

const props = defineProps<{
  modelValue: boolean
  orderId?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const logisticsList = ref<LogisticsTraceItem[]>([])
const loading = ref(false)

const visible = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const handleClose = () => {
  visible.value = false
}

const fetchLogisticsTrace = async () => {
  if (!props.orderId) {
    logisticsList.value = []
    return
  }
  loading.value = true
  try {
    const res = await getOrderLogisticsTraceAPI(props.orderId)
    logisticsList.value = res.data || []
  } catch (error) {
    ElMessage.error('加载物流轨迹失败')
    logisticsList.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    fetchLogisticsTrace()
  }
})

watch(() => props.orderId, () => {
  if (visible.value) {
    fetchLogisticsTrace()
  }
})
</script>

<template>
  <el-dialog title="订单跟踪" v-model="visible" :before-close="handleClose" width="40%">
    <el-steps direction="vertical" :active="logisticsList.length" finish-status="success" space="50px" v-loading="loading">
      <el-step v-for="(item, index) in logisticsList" :key="item.id" :title="item.content"
        :description="formatDateTime(item.createTime)"></el-step>
      <el-step v-if="logisticsList.length === 0" title="暂无物流轨迹" description=""></el-step>
    </el-steps>
  </el-dialog>
</template>

<style></style>
