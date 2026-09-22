<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPortalOrderListAPI, cancelPortalOrderAPI, confirmPortalReceiveAPI } from '@/apis/portalOrder'
import { useBuyerStore } from '@/stores/buyer'
import type { PortalOrderDetail } from '@/types/order'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BuyerOrderList'
})

const router = useRouter()
const buyerStore = useBuyerStore()
const orders = ref<PortalOrderDetail[]>([])
const status = ref(-1)
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const statusTabs = [
  { label: '全部', value: -1 },
  { label: '待付款', value: 0 },
  { label: '待发货', value: 1 },
  { label: '已发货', value: 2 },
  { label: '已完成', value: 3 },
  { label: '已关闭', value: 4 },
]

const statusMap: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '已发货',
  3: '已完成',
  4: '已关闭',
}

const loadOrders = async () => {
  if (!buyerStore.token) {
    orders.value = []
    return
  }
  loading.value = true
  try {
    const res = await getPortalOrderListAPI({ status: status.value, pageNum: pageNum.value, pageSize: pageSize.value })
    orders.value = res.data.list
    total.value = res.data.total
  } catch (err) {
    console.error('加载订单失败:', err)
  } finally {
    loading.value = false
  }
}

const switchStatus = (value: number) => {
  status.value = value
  pageNum.value = 1
  loadOrders()
}

const formatPrice = (price?: number) => {
  return price !== undefined ? `¥${price.toFixed(2)}` : '¥0.00'
}

const goLogin = () => {
  router.push('/buyer/login')
}

const cancelOrder = async (orderId?: number) => {
  if (!orderId) return
  try {
    await cancelPortalOrderAPI(orderId)
    ElMessage.success('取消成功')
    loadOrders()
  } catch (err) {
    console.error('取消失败:', err)
  }
}

const confirmReceive = async (orderId?: number) => {
  if (!orderId) return
  try {
    await confirmPortalReceiveAPI(orderId)
    ElMessage.success('确认收货成功')
    loadOrders()
  } catch (err) {
    console.error('确认收货失败:', err)
  }
}

onMounted(loadOrders)
</script>

<template>
  <div class="buyer-order-list">
    <div v-if="!buyerStore.token" class="login-tip">
      <p>登录后查看订单</p>
      <el-button type="primary" @click="goLogin">去登录</el-button>
    </div>

    <template v-else>
      <div class="status-tabs">
        <div v-for="tab in statusTabs" :key="tab.value" class="status-tab" :class="{ active: status === tab.value }"
          @click="switchStatus(tab.value)">
          {{ tab.label }}
        </div>
      </div>

      <div v-loading="loading" class="order-list">
        <div v-if="orders.length === 0" class="empty-tip">暂无订单</div>

        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-header">
            <span class="order-sn">订单号: {{ order.orderSn }}</span>
            <span class="order-status">{{ statusMap[order.status ?? -1] || '未知' }}</span>
          </div>
          <div class="order-body">
            <p class="order-address">{{ order.receiverName }} {{ order.receiverPhone }}</p>
            <p class="order-address">{{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverDetailAddress }}</p>
          </div>
          <div class="order-footer">
            <span class="order-total">合计: {{ formatPrice(order.payAmount) }}</span>
            <div class="order-actions">
              <el-button v-if="order.status === 0" type="primary" size="small" @click="cancelOrder(order.id)">取消</el-button>
              <el-button v-if="order.status === 2" type="warning" size="small" @click="confirmReceive(order.id)">确认收货</el-button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.buyer-order-list {
  min-height: 100%;
  padding: 12px;
  background: #f5f5f5;
}

.login-tip,
.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.status-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin-bottom: 12px;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.status-tab {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 14px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.status-tab.active {
  background: #ff5000;
  color: #fff;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.order-sn {
  font-size: 12px;
  color: #999;
}

.order-status {
  font-size: 13px;
  color: #ff5000;
  font-weight: 600;
}

.order-body {
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  padding: 10px 0;
  margin-bottom: 10px;
}

.order-address {
  margin: 0 0 4px;
  font-size: 13px;
  color: #666;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.order-actions {
  display: flex;
  gap: 8px;
}
</style>
