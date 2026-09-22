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
    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-input-box">
        <el-input v-model="keyword" placeholder="搜索商品" clearable @keyup.enter="onSearch">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="search-btn" @click="onSearch">搜索</el-button>
      </div>
    </div>

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
          <img v-if="product.pic" :src="product.pic" :alt="product.name">
          <div v-else class="image-placeholder">暂无图片</div>
        </div>
        <div class="product-info">
          <h3 class="product-title">{{ product.name }}</h3>
          <p class="product-subtitle">{{ product.subTitle || '' }}</p>
          <div class="product-meta">
            <span class="product-price">{{ formatPrice(product.price) }}</span>
            <span class="product-sales">{{ product.sale || 0 }} 人付款</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="products.length === 0 && !loading" class="empty-tip">暂无商品</div>

    <div class="load-more">
      <el-button v-if="products.length < total" type="primary" text :loading="loading" @click="loadMore">
        加载更多
      </el-button>
      <span v-else-if="products.length > 0" class="no-more">没有更多了</span>
    </div>
  </div>
</template>

<style scoped>
.buyer-index {
  padding: 12px;
  background: #f5f5f5;
  min-height: 100%;
}

.search-bar {
  margin-bottom: 12px;
}

.search-input-box {
  display: flex;
  gap: 8px;
}

.search-input-box :deep(.el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-btn {
  background-color: #ff5000;
  border-color: #ff5000;
  border-radius: 20px;
  padding: 0 18px;
}

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
  border-radius: 16px;
  background: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.category-item.active {
  background: #ff5000;
  color: #fff;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.product-image {
  width: 100%;
  height: 160px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  color: #999;
  font-size: 12px;
}

.product-info {
  padding: 10px;
}

.product-title {
  margin: 0 0 6px;
  font-size: 14px;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-subtitle {
  margin: 0 0 8px;
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  color: #ff5000;
  font-size: 16px;
  font-weight: 700;
}

.product-sales {
  color: #999;
  font-size: 11px;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 16px 0 8px;
}

.no-more {
  color: #999;
  font-size: 12px;
}

@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
