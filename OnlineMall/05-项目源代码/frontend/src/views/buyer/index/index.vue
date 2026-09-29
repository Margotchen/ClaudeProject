<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { searchProductAPI, getCategoryTreeAPI } from '@/apis/portalProduct'
import type { PmsProduct, PmsProductCategoryNode } from '@/types/portal'

defineOptions({
  name: 'BuyerIndex'
})

const router = useRouter()
const products = ref<PmsProduct[]>([])
const categories = ref<PmsProductCategoryNode[]>([])
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const activeCategory = ref<number | null>(null)

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await searchProductAPI({
      keyword: keyword.value || undefined,
      productCategoryId: activeCategory.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      sort: 0,
    })
    if (pageNum.value === 1) {
      products.value = res.data.list
    } else {
      products.value.push(...res.data.list)
    }
    total.value = res.data.total
  } catch (err) {
    console.error('加载商品失败:', err)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await getCategoryTreeAPI()
    categories.value = res.data
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

const onSearch = () => {
  pageNum.value = 1
  loadProducts()
}

const switchCategory = (id: number | null) => {
  activeCategory.value = id
  pageNum.value = 1
  loadProducts()
}

const goProductDetail = (id: number) => {
  router.push(`/buyer/product/${id}`)
}

const formatPrice = (price?: number) => {
  return price !== undefined ? `¥${price.toFixed(2)}` : '¥0.00'
}

const hasPromotion = (product: PmsProduct) => {
  return product.promotionPrice != null && product.price != null && product.promotionPrice < product.price
}

const displayPrice = (product: PmsProduct) => {
  return hasPromotion(product) ? product.promotionPrice : product.price
}

const loadMore = () => {
  if (products.value.length >= total.value) return
  pageNum.value += 1
  loadProducts()
}

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<template>
  <div class="buyer-index">
    <!-- Hero 区：深色渐变 + 搜索 -->
    <section class="hero">
      <h2 class="hero-title">品质好物 · 精选商城</h2>
      <p class="hero-subtitle">甄选好物，品质生活触手可及</p>
      <div class="hero-divider"></div>
      <div class="search-input-box">
        <el-input v-model="keyword" placeholder="搜索商品" clearable @keyup.enter="onSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button class="search-btn" @click="onSearch">搜索</el-button>
      </div>
    </section>

    <div class="index-body">
      <!-- 分类快速导航 -->
      <div class="category-list">
        <div class="category-item" :class="{ active: activeCategory === null }" @click="switchCategory(null)">
          全部
        </div>
        <div v-for="cate in categories" :key="cate.id" class="category-item"
          :class="{ active: activeCategory === cate.id }" @click="switchCategory(cate.id)">
          {{ cate.name }}
        </div>
      </div>

      <!-- 商品网格 -->
      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-card" @click="goProductDetail(product.id)">
          <div class="product-image">
            <span v-if="product.newStatus === 1" class="badge-new">新品</span>
            <img v-if="product.pic" :src="product.pic" :alt="product.name">
            <div v-else class="image-placeholder">暂无图片</div>
          </div>
          <div class="product-info">
            <h3 class="product-title">{{ product.name }}</h3>
            <p class="product-subtitle">{{ product.subTitle || '' }}</p>
            <div class="product-price-row">
              <span class="product-price">{{ formatPrice(displayPrice(product)) }}</span>
              <span v-if="hasPromotion(product)" class="product-original-price">{{ formatPrice(product.price) }}</span>
            </div>
            <div class="product-meta">
              <span class="product-brand">{{ product.brandName || '' }}</span>
              <span class="product-sales">{{ product.sale || 0 }} 人付款</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="products.length === 0 && !loading" class="empty-tip">暂无商品</div>

      <div class="load-more">
        <el-button v-if="products.length < total" class="load-more-btn" text :loading="loading" @click="loadMore">
          加载更多
        </el-button>
        <span v-else-if="products.length > 0" class="no-more">没有更多了</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.buyer-index {
  background: $buyer-bg;
  min-height: 100%;
}

/* Hero 区 */
.hero {
  padding: 28px 20px 26px;
  background: linear-gradient(135deg, $buyer-dark 0%, $buyer-dark-deep 100%);
  border-radius: 0 0 20px 20px;
}

.hero-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: $buyer-text-on-dark;
  letter-spacing: 2px;
}

.hero-subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: $buyer-text-on-dark-dim;
  letter-spacing: 1px;
}

.hero-divider {
  width: 36px;
  height: 3px;
  margin: 14px 0 18px;
  border-radius: 2px;
  background: linear-gradient(90deg, $buyer-accent, $buyer-accent-strong);
}

.search-input-box {
  display: flex;
  gap: 8px;
}

.search-input-box :deep(.el-input__wrapper) {
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.search-btn {
  border: none;
  border-radius: 999px;
  padding: 0 18px;
  color: #fff;
  background: linear-gradient(135deg, $buyer-accent 0%, $buyer-accent-strong 100%);
}

.search-btn:hover,
.search-btn:focus {
  color: #fff;
  background: linear-gradient(135deg, $buyer-accent-strong 0%, $buyer-accent 100%);
}

.index-body {
  padding: 12px;
}

/* 分类导航 */
.category-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0 12px;
  margin-bottom: 4px;
}

.category-list::-webkit-scrollbar {
  display: none;
}

.category-item {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 999px;
  background: $buyer-card;
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: $buyer-text-2;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.category-item.active {
  background: $buyer-dark;
  border-color: $buyer-dark;
  color: $buyer-accent;
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  @include buyer-card;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f0f1f3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-new {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  background: linear-gradient(135deg, $buyer-accent 0%, $buyer-accent-strong 100%);
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  color: $buyer-text-3;
  font-size: 12px;
}

.product-info {
  padding: 10px 12px 12px;
}

.product-title {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: $buyer-text-1;
  line-height: 1.3;
  @include text-ellipsis-2;
}

.product-subtitle {
  margin: 0 0 8px;
  font-size: 12px;
  color: $buyer-text-3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.product-price {
  color: $buyer-price;
  font-size: 17px;
  font-weight: 700;
}

.product-original-price {
  color: $buyer-text-3;
  font-size: 12px;
  text-decoration: line-through;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.product-brand {
  color: $buyer-text-3;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-sales {
  flex-shrink: 0;
  color: $buyer-text-3;
  font-size: 11px;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: $buyer-text-3;
}

.load-more {
  text-align: center;
  padding: 16px 0 8px;
}

.load-more-btn {
  color: $buyer-text-2;
}

.no-more {
  color: $buyer-text-3;
  font-size: 12px;
}

@media (hover: hover) and (min-width: 768px) {
  .product-card:hover {
    transform: translateY(-3px);
    box-shadow: $buyer-shadow-card-hover;
  }
}

@media (min-width: 768px) {
  .hero {
    margin-top: 16px;
    padding: 44px 48px 40px;
    border-radius: 16px;
  }

  .hero-title {
    font-size: 28px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .search-input-box {
    max-width: 560px;
  }

  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
