<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ShoppingCart } from '@element-plus/icons-vue'
import { getProductDetailAPI } from '@/apis/portalProduct'
import { addToCartAPI } from '@/apis/portalCart'
import { useBuyerStore } from '@/stores/buyer'
import type { PmsProduct } from '@/types/portal'
import type { PmsSkuStock } from '@/types/skuStock'
import { ElMessage } from 'element-plus'
import DOMPurify from 'dompurify'

defineOptions({
  name: 'BuyerProduct'
})

const route = useRoute()
const router = useRouter()
const buyerStore = useBuyerStore()

const product = ref<PmsProduct | null>(null)
// 富文本消毒，防 XSS
const safeDescription = computed(() => DOMPurify.sanitize(product.value?.description || '暂无商品描述'))
const skuList = ref<PmsSkuStock[]>([])
const quantity = ref(1)
const loading = ref(false)

/** 规格维度：{ key: '颜色', values: ['金色', '银色'] } */
type SpecDim = { key: string; values: string[] }
const specDims = ref<SpecDim[]>([])
/** 当前选中的规格值：{ 颜色: '金色' } */
const selectedSpecs = ref<Record<string, string>>({})

const parseSpData = (spData?: string): { key: string; value: string }[] => {
  if (!spData) return []
  try {
    const arr = JSON.parse(spData)
    return Array.isArray(arr) ? arr.filter(i => i && i.key) : []
  } catch {
    return []
  }
}

/** 从 skuList 构建规格维度 */
const buildSpecDims = (skus: PmsSkuStock[]): SpecDim[] => {
  const dimMap = new Map<string, string[]>()
  for (const sku of skus) {
    for (const sp of parseSpData(sku.spData)) {
      if (!dimMap.has(sp.key)) dimMap.set(sp.key, [])
      const values = dimMap.get(sp.key)!
      if (!values.includes(sp.value)) values.push(sp.value)
    }
  }
  return Array.from(dimMap.entries()).map(([key, values]) => ({ key, values }))
}

/** 当前选中规格组合匹配到的 SKU */
const selectedSku = computed<PmsSkuStock | null>(() => {
  if (!skuList.value.length) return null
  // 无规格维度时默认取第一个 SKU
  if (!specDims.value.length) return skuList.value[0] ?? null
  // 规格未选齐
  if (Object.keys(selectedSpecs.value).length < specDims.value.length) return null
  return skuList.value.find(sku => {
    const sps = parseSpData(sku.spData)
    return specDims.value.every(dim =>
      sps.some(sp => sp.key === dim.key && sp.value === selectedSpecs.value[dim.key])
    )
  }) || null
})

/** 某规格值在当前已选条件下是否有库存可配 */
const isSpecValueDisabled = (dimKey: string, value: string): boolean => {
  const candidate = { ...selectedSpecs.value, [dimKey]: value }
  return !skuList.value.some(sku => {
    const sps = parseSpData(sku.spData)
    const matched = Object.entries(candidate).every(([k, v]) =>
      sps.some(sp => sp.key === k && sp.value === v)
    )
    return matched && (sku.stock ?? 0) > 0
  })
}

const selectSpec = (dimKey: string, value: string) => {
  if (selectedSpecs.value[dimKey] === value) {
    // 再次点击取消选中
    const next = { ...selectedSpecs.value }
    delete next[dimKey]
    selectedSpecs.value = next
  } else {
    selectedSpecs.value = { ...selectedSpecs.value, [dimKey]: value }
  }
  quantity.value = 1
}

/** 展示价格：优先选中 SKU 的价格 */
const displayPrice = computed(() => selectedSku.value?.price ?? product.value?.price)
/** 展示库存：优先选中 SKU 的库存 */
const displayStock = computed(() => selectedSku.value?.stock ?? product.value?.stock ?? 0)
/** 是否可下单/加购 */
const canOperate = computed(() => {
  if (!product.value) return false
  if (!skuList.value.length) return true // 无 SKU 数据时按商品维度放开，后端兜底
  return selectedSku.value !== null && (selectedSku.value.stock ?? 0) > 0
})

const loadProduct = async () => {
  const id = Number(route.params.id)
  if (!id) return
  loading.value = true
  try {
    const res = await getProductDetailAPI(id)
    product.value = res.data.product
    skuList.value = res.data.skuStockList || []
    specDims.value = buildSpecDims(skuList.value)
    // 默认选中第一个有库存 SKU 的规格组合
    const defaultSku = skuList.value.find(s => (s.stock ?? 0) > 0) || skuList.value[0]
    if (defaultSku) {
      const defaults: Record<string, string> = {}
      for (const sp of parseSpData(defaultSku.spData)) defaults[sp.key] = sp.value
      selectedSpecs.value = defaults
    }
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

/** 校验登录与规格选择，通过返回 true */
const checkBeforeOperate = (): boolean => {
  if (!product.value) return false
  if (!buyerStore.token) {
    ElMessage.warning('请先登录')
    router.push('/buyer/login')
    return false
  }
  if (skuList.value.length && specDims.value.length && !selectedSku.value) {
    ElMessage.warning('请选择商品规格')
    return false
  }
  if (selectedSku.value && (selectedSku.value.stock ?? 0) < quantity.value) {
    ElMessage.warning('库存不足')
    return false
  }
  return true
}

const addToCart = async () => {
  if (!checkBeforeOperate() || !product.value) return
  try {
    await addToCartAPI({
      productId: product.value.id,
      productSkuId: selectedSku.value?.id,
      quantity: quantity.value,
    })
    ElMessage.success('已加入购物车')
  } catch (err) {
    console.error('加入购物车失败:', err)
  }
}

const buyNow = () => {
  if (!checkBeforeOperate() || !product.value) return
  const sku = selectedSku.value
  router.push({
    path: '/buyer/order/confirm',
    query: {
      direct: '1',
      productId: String(product.value.id),
      skuId: sku?.id ? String(sku.id) : '',
      quantity: String(quantity.value),
    },
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
          <span class="current-price">{{ formatPrice(displayPrice) }}</span>
          <span v-if="product.originalPrice" class="original-price">{{ formatPrice(product.originalPrice) }}</span>
        </div>
        <div class="meta-row">
          <span>销量 {{ product.sale || 0 }}</span>
          <span>库存 {{ displayStock }}</span>
        </div>
      </div>

      <div v-if="specDims.length" class="spec-section">
        <div v-for="dim in specDims" :key="dim.key" class="spec-row">
          <span class="spec-label">{{ dim.key }}</span>
          <div class="spec-values">
            <span
              v-for="value in dim.values"
              :key="value"
              class="spec-value"
              :class="{ active: selectedSpecs[dim.key] === value, disabled: isSpecValueDisabled(dim.key, value) }"
              @click="!isSpecValueDisabled(dim.key, value) && selectSpec(dim.key, value)"
            >{{ value }}</span>
          </div>
        </div>
      </div>

      <div class="quantity-row">
        <span class="quantity-label">数量</span>
        <el-input-number v-model="quantity" :min="1" :max="Math.max(displayStock, 1)" size="small" />
      </div>

      <div class="detail-description" v-html="safeDescription"></div>
    </div>

    <div class="detail-actions">
      <el-button class="cart-btn" :disabled="!canOperate" @click="addToCart">加入购物车</el-button>
      <el-button type="primary" class="buy-btn" :disabled="!canOperate" @click="buyNow">立即购买</el-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.buyer-product {
  background: $buyer-bg;
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
  color: $buyer-text-1;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.detail-body {
  background: $buyer-card;
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
  color: $buyer-text-3;
}

.detail-info {
  padding: 16px;
}

.product-name {
  margin: 0 0 8px;
  font-size: 18px;
  color: $buyer-text-1;
  line-height: 1.4;
}

.product-subtitle {
  margin: 0 0 12px;
  font-size: 13px;
  color: $buyer-text-3;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.current-price {
  color: $buyer-price;
  font-size: 24px;
  font-weight: 700;
}

.original-price {
  color: $buyer-text-3;
  font-size: 14px;
  text-decoration: line-through;
}

.meta-row {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: $buyer-text-2;
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
  color: $buyer-text-1;
}

.spec-section {
  padding: 12px 16px;
  background: $buyer-card;
  border-top: 1px solid #eee;
}

.spec-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.spec-row:last-child {
  margin-bottom: 0;
}

.spec-label {
  flex-shrink: 0;
  width: 56px;
  font-size: 13px;
  color: $buyer-text-3;
  line-height: 30px;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-value {
  padding: 4px 14px;
  font-size: 13px;
  color: $buyer-text-1;
  background: #f5f5f5;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  line-height: 20px;
}

.spec-value.active {
  color: $buyer-price;
  border-color: $buyer-price;
  background: #fdf3ee;
}

.spec-value.disabled {
  color: $buyer-text-3;
  background: #fafafa;
  cursor: not-allowed;
  text-decoration: line-through;
}

.detail-description {
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: $buyer-text-2;
  min-height: 120px;
}

.detail-actions {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  display: flex;
  height: 50px;
  background: $buyer-card;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 101;
}

.cart-btn {
  flex: 1;
  border: none;
  background: #f9ece4;
  color: $buyer-price;
  font-size: 15px;
  border-radius: 0;
}

.buy-btn {
  flex: 1;
  border: none;
  background: linear-gradient(135deg, $buyer-price 0%, #b34e2c 100%);
  color: #fff;
  font-size: 15px;
  border-radius: 0;
}

.buy-btn:hover {
  background: linear-gradient(135deg, #b34e2c 0%, $buyer-price 100%);
  color: #fff;
}

/* PC 端：左图右信息双栏布局 */
@media (min-width: 768px) {
  .buyer-product {
    padding: 16px 0 40px;
  }

  .detail-header {
    display: none;
  }

  .detail-body {
    display: grid;
    grid-template-columns: 480px 1fr;
    grid-template-areas:
      "img info"
      "img spec"
      "img qty"
      "desc desc";
    gap: 12px 24px;
    background: transparent;
  }

  .detail-image {
    grid-area: img;
    position: sticky;
    top: 80px;
    align-self: start;
    height: 480px;
    border-radius: $buyer-radius-card;
    overflow: hidden;
    background: $buyer-card;
    box-shadow: $buyer-shadow-card;
  }

  .detail-info {
    grid-area: info;
    align-self: start;
    background: $buyer-card;
    border-radius: $buyer-radius-card;
    padding: 24px;
    box-shadow: $buyer-shadow-card;
  }

  .product-name {
    font-size: 22px;
  }

  .current-price {
    font-size: 28px;
  }

  .quantity-row {
    grid-area: qty;
    align-self: start;
    justify-content: flex-start;
    gap: 16px;
    background: $buyer-card;
    border: none;
    border-radius: $buyer-radius-card;
    margin-top: 0;
    padding: 16px 24px;
    box-shadow: $buyer-shadow-card;
  }

  .spec-section {
    grid-area: spec;
    align-self: start;
    border: none;
    border-radius: $buyer-radius-card;
    padding: 16px 24px;
    box-shadow: $buyer-shadow-card;
  }

  .detail-description {
    grid-area: desc;
    background: $buyer-card;
    border-radius: $buyer-radius-card;
    padding: 24px;
    box-shadow: $buyer-shadow-card;
  }

  .detail-actions {
    position: static;
    height: 56px;
    margin-top: 12px;
    border-radius: $buyer-radius-card;
    overflow: hidden;
    box-shadow: $buyer-shadow-card;
  }

  .cart-btn {
    border-radius: $buyer-radius-card 0 0 $buyer-radius-card;
    font-size: 16px;
  }

  .buy-btn {
    border-radius: 0 $buyer-radius-card $buyer-radius-card 0;
    font-size: 16px;
  }
}
</style>
