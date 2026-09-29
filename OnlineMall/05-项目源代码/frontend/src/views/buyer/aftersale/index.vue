<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReturnApplyListAPI } from '@/apis/portalOrder'
import { useBuyerStore } from '@/stores/buyer'
import type { OmsOrderReturnApply } from '@/types/returnApply'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BuyerAfterSale'
})

const router = useRouter()
const buyerStore = useBuyerStore()

const applies = ref<OmsOrderReturnApply[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(5)
const total = ref(0)

const statusMap: Record<number, string> = {
  0: '待处理',
  1: '退货中',
  2: '已完成',
  3: '已拒绝',
}

const statusTypeMap: Record<number, 'warning' | 'primary' | 'success' | 'danger'> = {
  0: 'warning',
  1: 'primary',
  2: 'success',
  3: 'danger',
}

const returnTypeMap: Record<number, string> = {
  1: '退货退款',
  2: '仅退款',
}

const loadApplies = async () => {
  if (!buyerStore.token) {
    applies.value = []
    return
  }
  loading.value = true
  try {
    const res = await getReturnApplyListAPI({ pageNum: pageNum.value, pageSize: pageSize.value })
    applies.value = res.data.list
    total.value = res.data.total
  } catch (err) {
    console.error('加载售后申请失败:', err)
    ElMessage.error('加载售后申请失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pageNum.value = page
  loadApplies()
}

const formatPrice = (price?: number) => {
  return price !== undefined && price !== null ? `¥${Number(price).toFixed(2)}` : '-'
}

const goOrderDetail = (orderId?: number) => {
  if (!orderId) return
  router.push(`/buyer/order/detail/${orderId}`)
}

const goLogin = () => {
  router.push('/buyer/login')
}

onMounted(loadApplies)
</script>

<template>
  <div class="buyer-aftersale">
    <div v-if="!buyerStore.token" class="login-tip">
      <p>登录后查看售后申请</p>
      <el-button type="primary" @click="goLogin">去登录</el-button>
    </div>

    <template v-else>
      <div v-loading="loading" class="apply-list">
        <div v-if="applies.length === 0" class="empty-tip">暂无售后申请</div>

        <div v-for="apply in applies" :key="apply.id" class="apply-card">
          <div class="apply-header">
            <span class="apply-sn">服务单号: {{ apply.id }}</span>
            <el-tag :type="statusTypeMap[apply.status] || 'info'" size="small">
              {{ statusMap[apply.status] || '未知' }}
            </el-tag>
          </div>

          <div class="apply-body" @click="goOrderDetail(apply.orderId)">
            <div class="item-image">
              <img v-if="apply.productPic" :src="apply.productPic" :alt="apply.productName">
            </div>
            <div class="item-info">
              <p class="item-name">{{ apply.productName }}</p>
              <p class="item-attr">{{ apply.productAttr }}</p>
              <p class="item-meta">
                {{ returnTypeMap[apply.returnType ?? 1] }} · x{{ apply.productCount }} · {{ apply.reason }}
              </p>
            </div>
          </div>

          <div class="apply-footer">
            <div class="apply-amount">
              <span v-if="apply.status === 1 || apply.status === 2" class="refund-amount">
                退款金额: {{ formatPrice(apply.returnAmount) }}
              </span>
            </div>
            <span class="apply-time">{{ apply.createTime }}</span>
          </div>

          <div v-if="apply.handleRemark" class="handle-remark">
            商家处理意见：{{ apply.handleRemark }}
          </div>
        </div>
      </div>

      <div v-if="total > pageSize" class="pagination-wrap">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize"
          :current-page="pageNum" @current-change="handlePageChange" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.buyer-aftersale {
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

.apply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.apply-card {
  @include buyer-card;
  padding: 14px;
}

.apply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.apply-sn {
  font-size: 12px;
  color: $buyer-text-3;
}

.apply-body {
  display: flex;
  gap: 10px;
  align-items: center;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  padding: 10px 0;
  cursor: pointer;
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

.item-attr,
.item-meta {
  margin: 0;
  font-size: 12px;
  color: $buyer-text-3;
}

.apply-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
}

.refund-amount {
  font-size: 14px;
  font-weight: 600;
  color: $buyer-price;
}

.apply-time {
  font-size: 12px;
  color: $buyer-text-3;
}

.handle-remark {
  margin-top: 8px;
  padding: 8px 10px;
  background: #faf8f4;
  border-radius: 6px;
  font-size: 12px;
  color: $buyer-text-2;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0;
}

@media (min-width: 768px) {
  .buyer-aftersale {
    max-width: 860px;
    margin: 0 auto;
    padding: 16px 0 40px;
  }
}
</style>
