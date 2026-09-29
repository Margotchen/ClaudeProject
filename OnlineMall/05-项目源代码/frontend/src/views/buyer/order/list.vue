<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getPortalOrderListAPI,
  cancelPortalOrderAPI,
  confirmPortalReceiveAPI,
  payOrderAPI,
  deletePortalOrderAPI,
  createReturnApplyAPI,
  getLogisticsTraceAPI,
} from '@/apis/portalOrder'
import { useBuyerStore } from '@/stores/buyer'
import type { OmsOrderLogisticsTrace, PortalOrderDetail } from '@/types/order'
import type { ReturnApplyCreateParam } from '@/types/returnApply'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({
  name: 'BuyerOrderList'
})

const router = useRouter()
const buyerStore = useBuyerStore()
const orders = ref<PortalOrderDetail[]>([])
const status = ref(-1)
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)

const statusTabs = [
  { label: '全部', value: -1 },
  { label: '待支付', value: 1 },
  { label: '已支付', value: 2 },
  { label: '待发货', value: 3 },
  { label: '已发货', value: 4 },
  { label: '已收货', value: 5 },
  { label: '已完成', value: 6 },
  { label: '已取消', value: 7 },
  { label: '售后中', value: 8 },
]

const statusMap: Record<number, string> = {
  1: '待支付',
  2: '已支付',
  3: '待发货',
  4: '已发货',
  5: '已收货',
  6: '已完成',
  7: '已取消',
  8: '售后中',
}

const loadOrders = async () => {
  if (!buyerStore.token) {
    orders.value = []
    return
  }
  loading.value = true
  try {
    const res = await getPortalOrderListAPI({ status: status.value, pageNum: pageNum.value, pageSize: pageSize.value })
    orders.value = res.data.list ?? []
    total.value = res.data.total ?? 0
  } catch (err) {
    console.error('加载订单失败:', err)
    ElMessage.error('加载订单失败')
  } finally {
    loading.value = false
  }
}

const switchStatus = (value: number) => {
  status.value = value
  pageNum.value = 1
  loadOrders()
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  loadOrders()
}

const formatPrice = (price?: number) => {
  return price !== undefined ? `¥${price.toFixed(2)}` : '¥0.00'
}

const goLogin = () => {
  router.push('/buyer/login')
}

const goDetail = (orderId?: number) => {
  if (!orderId) return
  router.push(`/buyer/order/detail/${orderId}`)
}

const cancelOrder = async (order: PortalOrderDetail) => {
  try {
    await ElMessageBox.confirm('确定取消该订单吗？', '取消订单', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '再想想',
    })
  } catch {
    return
  }
  try {
    await cancelPortalOrderAPI(order.id)
    ElMessage.success('取消成功')
    loadOrders()
  } catch (err) {
    console.error('取消失败:', err)
    ElMessage.error('取消失败，请重试')
  }
}

const confirmReceive = async (order: PortalOrderDetail) => {
  try {
    await ElMessageBox.confirm('确认已收到商品吗？', '确认收货', {
      type: 'warning',
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await confirmPortalReceiveAPI(order.id)
    ElMessage.success('确认收货成功')
    loadOrders()
  } catch (err) {
    console.error('确认收货失败:', err)
    ElMessage.error('操作失败，请重试')
  }
}

const deleteOrder = async (order: PortalOrderDetail) => {
  try {
    await ElMessageBox.confirm('确定删除该订单吗？删除后不可恢复。', '删除订单', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  try {
    await deletePortalOrderAPI(order.id)
    ElMessage.success('删除成功')
    loadOrders()
  } catch (err) {
    console.error('删除订单失败:', err)
    ElMessage.error('删除失败，请重试')
  }
}

/* ---------- 模拟支付 ---------- */
const payDialogVisible = ref(false)
const payOrder = ref<PortalOrderDetail | null>(null)
const payType = ref(1)
const paying = ref(false)

const openPay = (order: PortalOrderDetail) => {
  payOrder.value = order
  payType.value = 1
  payDialogVisible.value = true
}

const submitPay = async () => {
  if (!payOrder.value) return
  paying.value = true
  try {
    await payOrderAPI(payOrder.value.id, payType.value)
    ElMessage.success('支付成功')
    payDialogVisible.value = false
    loadOrders()
  } catch (err) {
    console.error('支付失败:', err)
    ElMessage.error('支付失败，请重试')
  } finally {
    paying.value = false
  }
}

/* ---------- 查看物流 ---------- */
const logisticsDialogVisible = ref(false)
const logisticsOrder = ref<PortalOrderDetail | null>(null)
const logisticsTraces = ref<OmsOrderLogisticsTrace[]>([])
const logisticsLoading = ref(false)

const mockTraces = [
  { time: '今天 10:30', text: '快件正在派送中，请保持电话畅通' },
  { time: '昨天 18:20', text: '快件已到达【本市区转运中心】' },
  { time: '昨天 09:15', text: '快件已从【发货地分拨中心】发出' },
  { time: '发货当天 16:00', text: '商家已发货，快递公司已揽收' },
]

const openLogistics = async (order: PortalOrderDetail) => {
  logisticsOrder.value = order
  logisticsTraces.value = []
  logisticsDialogVisible.value = true
  logisticsLoading.value = true
  try {
    const res = await getLogisticsTraceAPI(order.id)
    logisticsTraces.value = res.data || []
  } catch (err) {
    console.error('加载物流轨迹失败:', err)
  } finally {
    logisticsLoading.value = false
  }
}

/* ---------- 退货申请 ---------- */
const returnDialogVisible = ref(false)
const returnOrder = ref<PortalOrderDetail | null>(null)
const returnSubmitting = ref(false)
const returnForm = reactive({
  orderItemIndex: 0,
  productCount: 1,
  returnType: 1,
  reason: '',
  description: '',
})

const returnReasons = [
  '商品质量问题',
  '商品与描述不符',
  '少发/漏发商品',
  '收到商品破损',
  '不喜欢/不想要了',
  '其他原因',
]

const openReturn = (order: PortalOrderDetail) => {
  returnOrder.value = order
  returnForm.orderItemIndex = 0
  returnForm.productCount = order.orderItemList?.[0]?.productQuantity || 1
  // 已收货/已完成可退货退款，其余仅退款
  returnForm.returnType = (order.status ?? 0) >= 5 ? 1 : 2
  returnForm.reason = ''
  returnForm.description = ''
  returnDialogVisible.value = true
}

const submitReturn = async () => {
  const order = returnOrder.value
  const item = order?.orderItemList?.[returnForm.orderItemIndex]
  if (!order || !item) return
  if (!returnForm.reason) {
    ElMessage.warning('请选择退货原因')
    return
  }
  returnSubmitting.value = true
  try {
    const params: ReturnApplyCreateParam = {
      orderId: order.id,
      productId: item.productId,
      orderSn: order.orderSn,
      memberUsername: buyerStore.buyerInfo.username,
      returnName: order.receiverName,
      returnPhone: order.receiverPhone,
      productPic: item.productPic,
      productName: item.productName,
      productBrand: item.productBrand,
      productAttr: item.productAttr,
      productCount: returnForm.productCount,
      productPrice: item.productPrice,
      productRealPrice: item.realAmount,
      returnType: returnForm.returnType,
      reason: returnForm.reason,
      description: returnForm.description,
    }
    await createReturnApplyAPI(params)
    ElMessage.success('售后申请已提交，请等待商家审核')
    returnDialogVisible.value = false
    loadOrders()
  } catch (err) {
    console.error('提交退货申请失败:', err)
    ElMessage.error('提交失败，请重试')
  } finally {
    returnSubmitting.value = false
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
          <div class="order-header" @click="goDetail(order.id)">
            <div class="order-meta">
              <span class="order-sn">订单号: {{ order.orderSn }}</span>
              <span class="order-time">{{ order.createTime }}</span>
            </div>
            <span class="order-status">{{ statusMap[order.status ?? -1] || '未知' }}</span>
          </div>

          <div class="order-items" @click="goDetail(order.id)">
            <div v-for="item in order.orderItemList" :key="item.id" class="order-item">
              <div class="item-image">
                <img v-if="item.productPic" :src="item.productPic" :alt="item.productName">
              </div>
              <div class="item-info">
                <p class="item-name">{{ item.productName }}</p>
                <p class="item-attr">{{ item.productAttr }}</p>
              </div>
              <div class="item-price">
                <span>{{ formatPrice(item.productPrice) }}</span>
                <span class="item-quantity">x{{ item.productQuantity }}</span>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <span class="order-total">合计: {{ formatPrice(order.payAmount) }}</span>
            <div class="order-actions">
              <el-button size="small" @click="goDetail(order.id)">查看详情</el-button>
              <template v-if="order.status === 1">
                <el-button type="primary" size="small" @click="openPay(order)">去支付</el-button>
                <el-button size="small" @click="cancelOrder(order)">取消</el-button>
              </template>
              <template v-else-if="order.status === 2 || order.status === 3">
                <el-button size="small" @click="openReturn(order)">申请退款</el-button>
              </template>
              <template v-else-if="order.status === 4">
                <el-button type="warning" size="small" @click="confirmReceive(order)">确认收货</el-button>
                <el-button size="small" @click="openLogistics(order)">查看物流</el-button>
                <el-button size="small" @click="openReturn(order)">申请退款</el-button>
              </template>
              <template v-else-if="order.status === 5">
                <el-button size="small" @click="openReturn(order)">申请售后</el-button>
                <el-button size="small" @click="openLogistics(order)">查看物流</el-button>
              </template>
              <template v-else-if="order.status === 6">
                <el-button size="small" @click="openReturn(order)">申请售后</el-button>
                <el-button size="small" @click="deleteOrder(order)">删除订单</el-button>
              </template>
              <el-button v-else-if="order.status === 7" size="small" @click="deleteOrder(order)">删除订单</el-button>
              <template v-else-if="order.status === 8">
                <el-button size="small" @click="openLogistics(order)">查看物流</el-button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div v-if="total > pageSize" class="pagination-wrap">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
          :current-page="pageNum" @current-change="handlePageChange" />
      </div>
    </template>

    <!-- 模拟支付弹窗 -->
    <el-dialog v-model="payDialogVisible" title="模拟支付" width="400px" append-to-body>
      <div v-if="payOrder" class="pay-dialog">
        <p class="pay-sn">订单号：{{ payOrder.orderSn }}</p>
        <p class="pay-amount">{{ formatPrice(payOrder.payAmount) }}</p>
        <el-radio-group v-model="payType">
          <el-radio :value="1">支付宝</el-radio>
          <el-radio :value="2">微信</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paying" @click="submitPay">确认支付</el-button>
      </template>
    </el-dialog>

    <!-- 物流弹窗 -->
    <el-dialog v-model="logisticsDialogVisible" title="物流信息" width="420px" append-to-body>
      <div v-if="logisticsOrder" v-loading="logisticsLoading" class="logistics-dialog">
        <p class="logistics-line">物流公司：{{ logisticsOrder.deliveryCompany || '暂无' }}</p>
        <p class="logistics-line">运单号码：{{ logisticsOrder.deliverySn || '暂无' }}</p>
        <el-timeline v-if="logisticsTraces.length > 0" class="logistics-timeline">
          <el-timeline-item v-for="trace in logisticsTraces" :key="trace.id" :timestamp="trace.createTime"
            :type="trace === logisticsTraces[0] ? 'primary' : 'info'">
            {{ trace.content }}
          </el-timeline-item>
        </el-timeline>
        <template v-else-if="!logisticsLoading">
          <el-timeline class="logistics-timeline">
            <el-timeline-item v-for="(trace, i) in mockTraces" :key="i" :timestamp="trace.time"
              :type="i === 0 ? 'primary' : 'info'">
              {{ trace.text }}
            </el-timeline-item>
          </el-timeline>
          <p class="logistics-tip">* 暂无真实轨迹，以上为模拟数据，仅供演示</p>
        </template>
      </div>
    </el-dialog>

    <!-- 售后申请弹窗 -->
    <el-dialog v-model="returnDialogVisible" title="申请售后" width="480px" append-to-body>
      <el-form v-if="returnOrder" label-width="90px">
        <el-form-item label="售后类型">
          <el-radio-group v-model="returnForm.returnType" :disabled="(returnOrder.status ?? 0) < 5">
            <el-radio :value="1">退货退款</el-radio>
            <el-radio :value="2">仅退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="售后商品">
          <el-select v-model="returnForm.orderItemIndex" style="width: 100%"
            @change="(i: number) => returnForm.productCount = returnOrder?.orderItemList?.[i]?.productQuantity || 1">
            <el-option v-for="(item, i) in returnOrder.orderItemList" :key="item.id" :value="i"
              :label="`${item.productName} x${item.productQuantity}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="退货数量">
          <el-input-number v-model="returnForm.productCount" :min="1"
            :max="returnOrder.orderItemList?.[returnForm.orderItemIndex]?.productQuantity || 1" />
        </el-form-item>
        <el-form-item label="退货原因" required>
          <el-select v-model="returnForm.reason" placeholder="请选择退货原因" style="width: 100%">
            <el-option v-for="r in returnReasons" :key="r" :value="r" :label="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="returnForm.description" type="textarea" :rows="3"
            placeholder="请描述商品问题（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="returnSubmitting" @click="submitReturn">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.buyer-order-list {
  min-height: 100%;
  padding: 12px;
  background: $buyer-bg;
}

.login-tip,
.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: $buyer-text-3;
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
  border-radius: 999px;
  background: $buyer-card;
  border: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 13px;
  color: $buyer-text-2;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.status-tab.active {
  background: $buyer-dark;
  border-color: $buyer-dark;
  color: $buyer-accent;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-card {
  @include buyer-card;
  padding: 14px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
}

.order-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-sn {
  font-size: 12px;
  color: $buyer-text-3;
}

.order-time {
  font-size: 12px;
  color: $buyer-text-3;
}

.order-status {
  font-size: 13px;
  color: $buyer-price;
  font-weight: 600;
}

.order-items {
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  padding: 10px 0;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
}

.order-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.item-image {
  width: 56px;
  height: 56px;
  background: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  margin: 0 0 4px;
  font-size: 13px;
  color: $buyer-text-1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-attr {
  margin: 0;
  font-size: 12px;
  color: $buyer-text-3;
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 13px;
  color: $buyer-text-1;
}

.item-quantity {
  font-size: 12px;
  color: $buyer-text-3;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.order-total {
  font-size: 14px;
  color: $buyer-text-1;
  font-weight: 600;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

.pay-dialog {
  text-align: center;
}

.pay-sn {
  font-size: 13px;
  color: $buyer-text-3;
  margin: 0 0 8px;
}

.pay-amount {
  font-size: 28px;
  font-weight: 700;
  color: $buyer-price;
  margin: 0 0 16px;
}

.logistics-line {
  margin: 0 0 8px;
  font-size: 14px;
  color: $buyer-text-1;
}

.logistics-timeline {
  margin-top: 16px;
  padding-left: 4px;
}

.logistics-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: $buyer-text-3;
}

/* PC 端：双列订单卡片 */
@media (min-width: 992px) {
  .buyer-order-list {
    padding: 16px 0 40px;
  }

  .status-tabs {
    padding: 4px 0;
  }

  .order-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    align-items: start;
  }

  .empty-tip {
    grid-column: 1 / -1;
  }
}
</style>
