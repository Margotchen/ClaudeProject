<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateConfirmOrderAPI, generateOrderAPI } from '@/apis/portalOrder'
import { useBuyerStore } from '@/stores/buyer'
import type { ConfirmOrderResult } from '@/types/order'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BuyerOrderConfirm'
})

interface MemberReceiveAddress {
  id: number
  name: string
  phone: string
  province: string
  city: string
  detailAddress: string
}

interface CartPromotionItem {
  productName: string
  productPic?: string
  price?: number
  quantity?: number
  productAttr?: string
}

const route = useRoute()
const router = useRouter()
const buyerStore = useBuyerStore()
const confirmResult = ref<ConfirmOrderResult | null>(null)
const loading = ref(false)
const submitting = ref(false)
const selectedAddressId = ref<number | null>(null)

const cartIds = computed(() => {
  const raw = route.query.cartIds
  if (!raw) return []
  return String(raw).split(',').map(id => Number(id)).filter(Boolean)
})

const totalPrice = computed(() => {
  return confirmResult.value?.calcAmount?.payAmount || confirmResult.value?.cartTotalPrice || 0
})

const addressList = computed((): MemberReceiveAddress[] => {
  return (confirmResult.value?.memberReceiveAddressList as unknown as MemberReceiveAddress[]) || []
})

const promotionList = computed((): CartPromotionItem[] => {
  return (confirmResult.value?.cartPromotionItemList as unknown as CartPromotionItem[]) || []
})

const loadConfirm = async () => {
  if (!buyerStore.token) {
    ElMessage.warning('请先登录')
    router.replace('/buyer/login')
    return
  }
  if (cartIds.value.length === 0) {
    ElMessage.warning('未选择商品')
    router.back()
    return
  }
  loading.value = true
  try {
    const res = await generateConfirmOrderAPI(cartIds.value)
    confirmResult.value = res.data
    if (addressList.value.length > 0) {
      selectedAddressId.value = addressList.value[0]?.id ?? null
    }
  } catch (err) {
    console.error('生成确认单失败:', err)
  } finally {
    loading.value = false
  }
}

const submitOrder = async () => {
  if (!confirmResult.value) return
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  submitting.value = true
  try {
    await generateOrderAPI({
      cartIds: cartIds.value,
      memberReceiveAddressId: selectedAddressId.value,
      payType: 0,
    })
    ElMessage.success('下单成功')
    router.replace('/buyer/order/list')
  } catch (err) {
    console.error('下单失败:', err)
  } finally {
    submitting.value = false
  }
}

const formatPrice = (price?: number) => {
  return price !== undefined ? `¥${price.toFixed(2)}` : '¥0.00'
}

onMounted(loadConfirm)
</script>

<template>
  <div v-loading="loading" class="buyer-order-confirm">
    <div v-if="!confirmResult" class="empty-tip">加载中...</div>

    <div v-else class="confirm-body">
      <!-- 收货地址 -->
      <div class="section address-section">
        <h3 class="section-title">收货地址</h3>
        <div v-if="addressList.length > 0" class="address-list">
          <div v-for="addr in addressList" :key="addr.id" class="address-item"
            :class="{ active: selectedAddressId === addr.id }" @click="selectedAddressId = addr.id">
            <div class="address-header">
              <span class="address-name">{{ addr.name }}</span>
              <span class="address-phone">{{ addr.phone }}</span>
            </div>
            <p class="address-detail">{{ addr.province }} {{ addr.city }} {{ addr.detailAddress }}</p>
          </div>
        </div>
        <div v-else class="no-address">暂无收货地址，请先到个人中心添加</div>
      </div>

      <!-- 商品清单 -->
      <div class="section product-section">
        <h3 class="section-title">商品清单</h3>
        <div class="product-list">
          <div v-for="(item, index) in promotionList" :key="index" class="product-item">
            <div class="product-image">
              <img v-if="item.productPic" :src="item.productPic" :alt="item.productName">
            </div>
            <div class="product-info">
              <h4 class="product-name">{{ item.productName }}</h4>
              <p class="product-attr">{{ item.productAttr || '' }}</p>
              <div class="product-meta">
                <span class="product-price">¥{{ (item.price || 0).toFixed(2) }}</span>
                <span class="product-quantity">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 金额汇总 -->
      <div class="section amount-section">
        <div class="amount-row">
          <span>商品总价</span>
          <span>{{ formatPrice(confirmResult.cartTotalPrice) }}</span>
        </div>
        <div class="amount-row">
          <span>运费</span>
          <span>{{ formatPrice(confirmResult.freightPrice) }}</span>
        </div>
        <div class="amount-row">
          <span>优惠</span>
          <span>-{{ formatPrice(confirmResult.couponTotalPrice) }}</span>
        </div>
        <div class="amount-row total-row">
          <span>应付总额</span>
          <span class="total-price">{{ formatPrice(totalPrice) }}</span>
        </div>
      </div>
    </div>

    <div class="confirm-footer">
      <span class="footer-total">合计: <strong>{{ formatPrice(totalPrice) }}</strong></span>
      <el-button type="primary" class="submit-btn" :loading="submitting" @click="submitOrder">提交订单</el-button>
    </div>
  </div>
</template>

<style scoped>
.buyer-order-confirm {
  min-height: 100%;
  padding: 12px;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-item {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
}

.address-item.active {
  border-color: #ff5000;
  background: #fff5f0;
}

.address-header {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.address-phone {
  color: #999;
}

.address-detail {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.no-address {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item {
  display: flex;
  gap: 10px;
}

.product-image {
  width: 70px;
  height: 70px;
  background: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  margin: 0 0 4px;
  font-size: 14px;
  color: #333;
  line-height: 1.3;
}

.product-attr {
  margin: 0 0 8px;
  font-size: 12px;
  color: #999;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.product-price {
  color: #ff5000;
  font-weight: 700;
}

.product-quantity {
  color: #999;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.total-row {
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-top: 10px;
  font-weight: 600;
  color: #333;
}

.total-price {
  color: #ff5000;
  font-size: 18px;
}

.confirm-footer {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 101;
}

.footer-total {
  font-size: 14px;
  color: #333;
}

.footer-total strong {
  color: #ff5000;
  font-size: 18px;
}

.submit-btn {
  background: #ff5000;
  border-color: #ff5000;
  border-radius: 20px;
  padding: 0 20px;
}

.submit-btn:hover {
  background: #e64a00;
  border-color: #e64a00;
}
</style>
