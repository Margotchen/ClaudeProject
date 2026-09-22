<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ShoppingCart } from '@element-plus/icons-vue'
import { getProductDetailAPI } from '@/apis/portalProduct'
import { addToCartAPI } from '@/apis/portalCart'
import { useBuyerStore } from '@/stores/buyer'
import type { PmsProduct } from '@/types/portal'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BuyerProduct'
})

const route = useRoute()
const router = useRouter()
const buyerStore = useBuyerStore()

const product = ref<PmsProduct | null>(null)
const quantity = ref(1)
const loading = ref(false)

const loadProduct = async () => {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res = await getProductDetailAPI(id)
    product.value = res.data.product
  } catch (err) {
    console.error('加载商品详情失败:', err)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price?: number) => {
  return price !== undefined ? `¥${price.toFixed(2)}` : '¥0.00'
}

const goBack = () => {
  router.back()
}

const goCart = () => {
  router.push('/buyer/cart')
}

const addToCart = async () => {
  if (!product.value) return
  if (!buyerStore.token) {
    ElMessage.warning('请先登录')
    router.push('/buyer/login')
    return
  }
  try {
    await addToCartAPI({
      productId: product.value.id,
      quantity: quantity.value,
    })
    ElMessage.success('已加入购物车')
  } catch (err) {
    console.error('加入购物车失败:', err)
  }
}

const buyNow = () => {
  if (!product.value) return
  if (!buyerStore.token) {
    ElMessage.warning('请先登录')
    router.push('/buyer/login')
    return
  }
  router.push({
    path: '/buyer/order/confirm',
    query: { productId: String(product.value.id), quantity: String(quantity.value) },
  })
}

onMounted(loadProduct)
</script>

<template>
  <div v-loading="loading" class="buyer-product">
    <div class="detail-header">
      <el-icon class="back-icon" @click="goBack"><ArrowLeft /></el-icon>
      <span class="detail-title">商品详情</span>
      <el-icon class="cart-icon" @click="goCart"><ShoppingCart /></el-icon>
    </div>

    <div v-if="product" class="detail-body">
      <div class="detail-image">
        <img v-if="product.pic" :src="product.pic" :alt="product.name">
        <div v-else class="image-placeholder">暂无图片</div>
      </div>

      <div class="detail-info">
        <h1 class="product-name">{{ product.name }}</h1>
        <p class="product-subtitle">{{ product.subTitle || '' }}</p>
        <div class="price-row">
          <span class="current-price">{{ formatPrice(product.price) }}</span>
          <span v-if="product.originalPrice" class="original-price">{{ formatPrice(product.originalPrice) }}</span>
        </div>
        <div class="meta-row">
          <span>销量 {{ product.sale || 0 }}</span>
          <span>库存 {{ product.stock || 0 }}</span>
        </div>
      </div>

      <div class="quantity-row">
        <span class="quantity-label">数量</span>
        <el-input-number v-model="quantity" :min="1" :max="product.stock || 99" size="small" />
      </div>

      <div class="detail-description" v-html="product.description || '暂无商品描述'"></div>
    </div>

    <div class="detail-actions">
      <el-button class="cart-btn" @click="addToCart">加入购物车</el-button>
      <el-button type="primary" class="buy-btn" @click="buyNow">立即购买</el-button>
    </div>
  </div>
</template>

<style scoped>
.buyer-product {
  background: #f5f5f5;
  min-height: 100%;
  padding-bottom: 70px;
}

.detail-header {
  position: sticky;
  top: 0;
  z-index: 101;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.back-icon,
.cart-icon {
  font-size: 22px;
  cursor: pointer;
  color: #333;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-body {
  background: #fff;
}

.detail-image {
  width: 100%;
  height: 320px;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-placeholder {
  color: #999;
}

.detail-info {
  padding: 16px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
  line-height: 1.4;
}

.product-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  color: #999;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.current-price {
  color: #ff5000;
  font-size: 24px;
  font-weight: 700;
}

.original-price {
  color: #999;
  font-size: 14px;
  text-decoration: line-through;
}

.meta-row {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #666;
}

.quantity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fafafa;
  margin-top: 10px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.quantity-label {
  font-size: 14px;
  color: #333;
}

.detail-description {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  min-height: 120px;
}

.detail-actions {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  display: flex;
  height: 50px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 101;
}

.cart-btn {
  flex: 1;
  border: none;
  background: #ffece6;
  color: #ff5000;
  font-size: 15px;
  border-radius: 0;
}

.buy-btn {
  flex: 1;
  background: #ff5000;
  border-color: #ff5000;
  color: #fff;
  font-size: 15px;
  border-radius: 0;
}

.buy-btn:hover {
  background: #e64a00;
  border-color: #e64a00;
}
</style>
