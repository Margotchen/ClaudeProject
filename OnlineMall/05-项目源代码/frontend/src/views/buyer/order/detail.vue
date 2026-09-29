<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getPortalOrderDetailAPI,
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
  name: 'BuyerOrderDetail'
})

const route = useRoute()
const router = useRouter()
const buyerStore = useBuyerStore()

const order = ref<PortalOrderDetail | null>(null)
const loading = ref(false)

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

const historyStatusMap = statusMap

const orderId = Number(route.params.id)

const loadDetail = async () => {
  if (!buyerStore.token) {
    ElMessage.warning('请先登录')
    router.replace('/buyer/login')
    return
  }
  if (!orderId) {
    ElMessage.error('订单参数错误')
    router.back()
    return
  }
  loading.value = true
  try {
    const res = await getPortalOrderDetailAPI(orderId)
    order.value = res.data
  } catch (err) {
    console.error('加载订单详情失败:', err)
    ElMessage.error('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

const formatPrice = (price?: number) => {
  return price !== undefined ? `¥${price.toFixed(2)}` : '¥0.00'
}

const cancelOrder = async () => {
  if (!order.value) return
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
    await cancelPortalOrderAPI(order.value.id)
    ElMessage.success('取消成功')
    loadDetail()
  } catch (err) {
    console.error('取消失败:', err)
    ElMessage.error('取消失败，请重试')
  }
}

const confirmReceive = async () => {
  if (!order.value) return
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
    await confirmPortalReceiveAPI(order.value.id)
    ElMessage.success('确认收货成功')
    loadDetail()
  } catch (err) {
    console.error('确认收货失败:', err)
    ElMessage.error('操作失败，请重试')
  }
}

const deleteOrder = async () => {
  if (!order.value) return
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
    await deletePortalOrderAPI(order.value.id)
    ElMessage.success('删除成功')
    router.replace('/buyer/order/list')
  } catch (err) {
    console.error('删除订单失败:', err)
    ElMessage.error('删除失败，请重试')
  }
}

/* ---------- 模拟支付 ---------- */
const payDialogVisible = ref(false)
const payType = ref(1)
const paying = ref(false)

const submitPay = async () => {
  if (!order.value) return
  paying.value = true
  try {
    await payOrderAPI(order.value.id, payType.value)
    ElMessage.success('支付成功')
    payDialogVisible.value = false
    loadDetail()
  } catch (err) {
    console.error('支付失败:', err)
    ElMessage.error('支付失败，请重试')
  } finally {
    paying.value = false
  }
}

/* ---------- 物流 ---------- */
const logisticsDialogVisible = ref(false)
const logisticsTraces = ref<OmsOrderLogisticsTrace[]>([])
const logisticsLoading = ref(false)

const mockTraces = [
  { time: '今天 10:30', text: '快件正在派送中，请保持电话畅通' },
  { time: '昨天 18:20', text: '快件已到达【本市区转运中心】' },
  { time: '昨天 09:15', text: '快件已从【发货地分拨中心】发出' },
  { time: '发货当天 16:00', text: '商家已发货，快递公司已揽收' },
]

const openLogistics = async () => {
  if (!order.value) return
  logisticsTraces.value = []
  logisticsDialogVisible.value = true
  logisticsLoading.value = true
  try {
    const res = await getLogisticsTraceAPI(order.value.id)
    logisticsTraces.value = res.data || []
  } catch (err) {
    console.error('加载物流轨迹失败:', err)
  } finally {
    logisticsLoading.value = false
  }
}

/* ---------- 退货申请 ---------- */
const returnDialogVisible = ref(false)
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

const openReturn = () => {
  if (!order.value) return
  returnForm.orderItemIndex = 0
  returnForm.productCount = order.value.orderItemList?.[0]?.productQuantity || 1
  // 已收货/已完成可退货退款，其余仅退款
  returnForm.returnType = (order.value.status ?? 0) >= 5 ? 1 : 2
  returnForm.reason = ''
  returnForm.description = ''
  returnDialogVisible.value = true
}

const submitReturn = async () => {
  const current = order.value
  const item = current?.orderItemList?.[returnForm.orderItemIndex]
  if (!current || !item) return
  if (!returnForm.reason) {
    ElMessage.warning('请选择退货原因')
    return
  }
  returnSubmitting.value = true
  try {
    const params: ReturnApplyCreateParam = {
      orderId: current.id,
      productId: item.productId,
      orderSn: current.orderSn,
      memberUsername: buyerStore.buyerInfo.username,
      returnName: current.receiverName,
      returnPhone: current.receiverPhone,
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
    loadDetail()
  } catch (err) {
    console.error('提交退货申请失败:', err)
    ElMessage.error('提交失败，请重试')
  } finally {
    returnSubmitting.value = false
  }
}

onMounted(loadDetail)
</script>

<template>
  <div v-loading="loading" class="buyer-order-detail">
    <div v-if="!order" class="empty-tip">{{ loading ? '加载中...' : '订单不存在' }}</div>

    <template v-else>
      <!-- 状态条 -->
      <div class="status-banner">
        <div class="status-text">{{ statusMap[order.status ?? -1] || '未知状态' }}</div>
        <div class="status-sub">订单号：{{ order.orderSn }}</div>
        <div class="status-sub">下单时间：{{ order.createTime }}</div>
      </div>

      <!-- 收货信息 -->
      <div class="section">
        <h3 class="section-title">收货信息</h3>
        <p class="info-line">{{ order.receiverName }} {{ order.receiverPhone }}</p>
        <p class="info-line">
          {{ order.receiverProvince }} {{ order.receiverCity }} {{ order.receiverRegion }}
          {{ order.receiverDetailAddress }}
          <span v-if="order.receiverPostCode">（{{ order.receiverPostCode }}）</span>
        </p>
      </div>

      <!-- 物流信息 -->
      <div v-if="order.status !== undefined && order.status >= 4 && order.status <= 6" class="section">
        <h3 class="section-title">物流信息</h3>
        <template v-if="order.deliverySn">
          <p class="info-line">物流公司：{{ order.deliveryCompany || '暂无' }}</p>
          <p class="info-line">运单号码：{{ order.deliverySn }}</p>
          <el-button size="small" text type="primary" @click="openLogistics">查看物流轨迹</el-button>
        </template>
        <p v-else class="info-line muted">暂无物流信息</p>
      </div>

      <!-- 商品明细 -->
      <div class="section">
        <h3 class="section-title">商品明细</h3>
        <div class="item-list">
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
      </div>

      <!-- 金额明细 -->
      <div class="section">
        <h3 class="section-title">金额明细</h3>
        <div class="amount-row">
          <span>商品总价</span>
          <span>{{ formatPrice(order.totalAmount) }}</span>
        </div>
        <div class="amount-row">
          <span>运费</span>
          <span>{{ formatPrice(order.freightAmount) }}</span>
        </div>
        <div v-if="order.promotionAmount" class="amount-row">
          <span>促销优惠</span>
          <span>-{{ formatPrice(order.promotionAmount) }}</span>
        </div>
        <div class="amount-row total-row">
          <span>实付款</span>
          <span class="total-price">{{ formatPrice(order.payAmount) }}</span>
        </div>
      </div>

      <!-- 操作记录 -->
      <div v-if="order.historyList && order.historyList.length > 0" class="section">
        <h3 class="section-title">操作记录</h3>
        <el-timeline>
          <el-timeline-item v-for="h in order.historyList" :key="h.id" :timestamp="h.createTime">
            {{ h.operateMan }}：{{ h.note || historyStatusMap[h.orderStatus] || '' }}
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 操作按钮 -->
      <div class="detail-actions">
        <template v-if="order.status === 1">
          <el-button type="primary" @click="payDialogVisible = true">去支付</el-button>
          <el-button @click="cancelOrder">取消订单</el-button>
        </template>
        <template v-else-if="order.status === 2 || order.status === 3">
          <el-button @click="openReturn">申请退款</el-button>
        </template>
        <template v-else-if="order.status === 4">
          <el-button type="warning" @click="confirmReceive">确认收货</el-button>
          <el-button @click="openLogistics">查看物流</el-button>
          <el-button @click="openReturn">申请退款</el-button>
        </template>
        <template v-else-if="order.status === 5">
          <el-button @click="openReturn">申请售后</el-button>
          <el-button @click="openLogistics">查看物流</el-button>
        </template>
        <template v-else-if="order.status === 6">
          <el-button @click="openReturn">申请售后</el-button>
          <el-button @click="deleteOrder">删除订单</el-button>
        </template>
        <el-button v-else-if="order.status === 7" @click="deleteOrder">删除订单</el-button>
      </div>
    </template>

    <!-- 模拟支付弹窗 -->
    <el-dialog v-model="payDialogVisible" title="模拟支付" width="400px" append-to-body>
      <div v-if="order" class="pay-dialog">
        <p class="pay-sn">订单号：{{ order.orderSn }}</p>
        <p class="pay-amount">{{ formatPrice(order.payAmount) }}</p>
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
      <div v-if="order" v-loading="logisticsLoading" class="logistics-dialog">
        <p class="logistics-line">物流公司：{{ order.deliveryCompany || '暂无' }}</p>
        <p class="logistics-line">运单号码：{{ order.deliverySn || '暂无' }}</p>
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
      <el-form v-if="order" label-width="90px">
        <el-form-item label="售后类型">
          <el-radio-group v-model="returnForm.returnType" :disabled="(order.status ?? 0) < 5">
            <el-radio :value="1">退货退款</el-radio>
            <el-radio :value="2">仅退款</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="售后商品">
          <el-select v-model="returnForm.orderItemIndex" style="width: 100%"
            @change="(i: number) => returnForm.productCount = order?.orderItemList?.[i]?.productQuantity || 1">
            <el-option v-for="(item, i) in order.orderItemList" :key="item.id" :value="i"
              :label="`${item.productName} x${item.productQuantity}`" />
          </el-select>
        </el-form-item>
        <el-form-item label="退货数量">
          <el-input-number v-model="returnForm.productCount" :min="1"
            :max="order.orderItemList?.[returnForm.orderItemIndex]?.productQuantity || 1" />
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
.buyer-order-detail {
  min-height: 100%;
  padding: 12px;
  background: $buyer-bg;
}

.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: $buyer-text-3;
}

.status-banner {
  background: linear-gradient(135deg, $buyer-dark 0%, $buyer-dark-deep 100%);
  border-radius: 12px;
  padding: 20px;
  color: $buyer-text-on-dark;
  margin-bottom: 10px;
}

.status-text {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.status-sub {
  font-size: 12px;
  color: $buyer-text-on-dark-dim;
  margin-top: 2px;
}

.section {
  background: $buyer-card;
  border-radius: $buyer-radius-card;
  box-shadow: $buyer-shadow-card;
  padding: 14px;
  margin-bottom: 10px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: $buyer-text-1;
}

.info-line {
  margin: 0 0 6px;
  font-size: 13px;
  color: $buyer-text-2;
  line-height: 1.5;
}

.info-line.muted {
  color: $buyer-text-3;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.amount-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: $buyer-text-2;
  margin-bottom: 8px;
}

.total-row {
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 10px;
  font-weight: 600;
  color: $buyer-text-1;
}

.total-price {
  color: $buyer-price;
  font-size: 18px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 0 20px;
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

@media (min-width: 768px) {
  .buyer-order-detail {
    max-width: 860px;
    margin: 0 auto;
    padding: 16px 0 40px;
  }

  .section {
    padding: 20px;
  }
}
</style>
