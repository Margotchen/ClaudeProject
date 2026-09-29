<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { generateConfirmOrderAPI, generateDirectConfirmOrderAPI, generateOrderAPI, payOrderAPI } from '@/apis/portalOrder'
import { useBuyerStore } from '@/stores/buyer'
import type { ConfirmOrderResult } from '@/types/order'
import type { Address } from '@/types/address'
import { ElMessage, ElMessageBox } from 'element-plus'

defineOptions({
  name: 'BuyerOrderConfirm'
})

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

/** 立即购买模式（query: direct=1&productId=&skuId=&quantity=） */
const directBuy = computed(() => {
  if (route.query.direct !== '1') return null
  const productId = Number(route.query.productId)
  if (!productId) return null
  const skuId = Number(route.query.skuId)
  const quantity = Number(route.query.quantity) || 1
  return { productId, productSkuId: skuId || undefined, quantity }
})

const totalPrice = computed(() => {
  return confirmResult.value?.calcAmount?.payAmount || confirmResult.value?.cartTotalPrice || 0
})

const addressList = computed((): Address[] => {
  return (confirmResult.value?.memberReceiveAddressList as unknown as Address[]) || []
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
  if (!directBuy.value && cartIds.value.length === 0) {
    ElMessage.warning('未选择商品')
    router.back()
    return
  }
  loading.value = true
  try {
    const res = directBuy.value
      ? await generateDirectConfirmOrderAPI(directBuy.value)
      : await generateConfirmOrderAPI(cartIds.value)
    confirmResult.value = res.data
    if (addressList.value.length > 0) {
      const defaultAddr = addressList.value.find(a => a.defaultStatus === 1)
      selectedAddressId.value = defaultAddr?.id ?? addressList.value[0]?.id ?? null
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
    const res = await generateOrderAPI(
      directBuy.value
        ? {
            productId: directBuy.value.productId,
            productSkuId: directBuy.value.productSkuId,
            quantity: directBuy.value.quantity,
            memberReceiveAddressId: selectedAddressId.value,
            payType: 0,
          }
        : {
            cartIds: cartIds.value,
            memberReceiveAddressId: selectedAddressId.value,
            payType: 0,
          },
    )
    const createdOrder = (res.data as { order?: { id?: number } } | null)?.order
    ElMessage.success('下单成功')
    try {
      await ElMessageBox.confirm('下单成功，是否立即支付？', '支付确认', {
        type: 'success',
        confirmButtonText: '立即支付',
        cancelButtonText: '稍后支付',
      })
      if (createdOrder?.id) {
        try {
          await payOrderAPI(createdOrder.id, 1)
          ElMessage.success('支付成功')
        } catch (payErr) {
          // 支付失败保留待支付订单，跳转后可在订单列表重新支付
          console.error('支付失败:', payErr)
          ElMessage.warning('支付未完成，可稍后在订单列表中重新支付')
        }
      }
    } catch {
      // 用户选择稍后支付，订单保留为待付款
    }
    router.replace('/buyer/order/list')
  } catch (err) {
    console.error('下单失败:', err)
    ElMessage.error('下单失败，请重试')
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
            :class="{ active: selectedAddressId === addr.id }" @click="selectedAddressId = addr.id ?? null">
            <div class="address-header">
              <span class="address-name">{{ addr.name }}</span>
              <span class="address-phone">{{ addr.phoneNumber }}</span>
            </div>
            <p class="address-detail">{{ addr.province }} {{ addr.city }} {{ addr.region }} {{ addr.detailAddress }}</p>
          </div>
        </div>
        <div v-else class="no-address">
          暂无收货地址，<router-link to="/buyer/address" class="address-link">点击添加</router-link>
        </div>
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

<style scoped lang="scss">
.buyer-order-confirm {
  min-height: 100%;
  padding: 12px;
  background: $buyer-bg;
  padding-bottom: 70px;
}

.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: $buyer-text-3;
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
  transition: border-color 0.2s, background 0.2s;
}

.address-item.active {
  border-color: $buyer-accent;
  background: #faf6ee;
}

.address-header {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 14px;
  color: $buyer-text-1;
}

.address-phone {
  color: $buyer-text-3;
}

.address-detail {
  margin: 0;
  font-size: 13px;
  color: $buyer-text-2;
  line-height: 1.4;
}

.no-address {
  color: $buyer-text-3;
  font-size: 13px;
  text-align: center;
  padding: 16px 0;
}

.address-link {
  color: $buyer-accent;
  text-decoration: none;
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
  color: $buyer-text-1;
  line-height: 1.3;
}

.product-attr {
  margin: 0 0 8px;
  font-size: 12px;
  color: $buyer-text-3;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.product-price {
  color: $buyer-price;
  font-weight: 700;
}

.product-quantity {
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
  background: $buyer-card;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 101;
}

.footer-total {
  font-size: 14px;
  color: $buyer-text-1;
}

.footer-total strong {
  color: $buyer-price;
  font-size: 18px;
}

.submit-btn {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, $buyer-price 0%, #b34e2c 100%);
  border-radius: 20px;
  padding: 0 20px;
}

.submit-btn:hover {
  color: #fff;
  background: linear-gradient(135deg, #b34e2c 0%, $buyer-price 100%);
}

/* PC 端：左侧地址+清单，右侧金额汇总 */
@media (min-width: 768px) {
  .buyer-order-confirm {
    padding: 16px 0 40px;
  }

  .confirm-body {
    display: grid;
    grid-template-columns: 1fr 360px;
    grid-template-areas:
      "addr amt"
      "prod amt";
    gap: 12px;
    align-items: start;
  }

  .section {
    margin-bottom: 0;
    padding: 20px;
  }

  .address-section {
    grid-area: addr;
  }

  .product-section {
    grid-area: prod;
  }

  .amount-section {
    grid-area: amt;
    position: sticky;
    top: 80px;
  }

  .product-image {
    width: 88px;
    height: 88px;
  }

  .confirm-footer {
    position: static;
    height: 56px;
    margin-top: 12px;
    padding: 0 20px;
    border-radius: $buyer-radius-card;
    box-shadow: $buyer-shadow-card;
  }

  .submit-btn {
    height: 40px;
    padding: 0 32px;
  }
}
</style>
