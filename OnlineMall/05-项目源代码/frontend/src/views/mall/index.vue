<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Picture, Search, ShoppingBag } from '@element-plus/icons-vue'
import { getProductListAPI } from '@/apis/product'
import { useUserStore } from '@/stores/user'
import type { PmsProduct, ProductQueryParam } from '@/types/product'
import LoginModal from './components/LoginModal.vue'
import UserPanel from './components/UserPanel.vue'
import CategorySidebar from './components/CategorySidebar.vue'

defineOptions({
  name: 'MallIndex'
})

const userStore = useUserStore()

// 查询参数
const listQuery = ref<ProductQueryParam>({
  pageNum: 1,
  pageSize: 20,
  publishStatus: 1
})

// 商品列表
const list = ref<PmsProduct[]>([])
const total = ref(0)
const listLoading = ref(false)

// 搜索关键词
const searchKeyword = ref('')
const isSearching = ref(false)

// 登录弹窗
const loginVisible = ref(false)

// 商品详情弹窗
const selectedProduct = ref<PmsProduct | null>(null)
const dialogVisible = ref(false)

// 获取商品列表
const getList = async () => {
  listLoading.value = true
  try {
    const res = await getProductListAPI(listQuery.value)
    list.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    listLoading.value = false
  }
}

// 组件挂载
onMounted(() => {
  getList()
})

// 处理分页变化
const handleCurrentChange = (val: number) => {
  listQuery.value.pageNum = val
  getList()
}

const handleSizeChange = (val: number) => {
  listQuery.value.pageSize = val
  listQuery.value.pageNum = 1
  getList()
}

// 搜索
const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    isSearching.value = false
    listQuery.value.pageSize = 20
    listQuery.value.pageNum = 1
    getList()
    return
  }
  isSearching.value = true
  listQuery.value.pageNum = 1
  listQuery.value.pageSize = 100
  getList()
}

const clearSearch = () => {
  searchKeyword.value = ''
  isSearching.value = false
  listQuery.value.pageSize = 20
  listQuery.value.pageNum = 1
  getList()
}

// 分类筛选
const handleCategorySelect = (categoryId?: number) => {
  listQuery.value.productCategoryId = categoryId
  listQuery.value.pageNum = 1
  searchKeyword.value = ''
  isSearching.value = false
  listQuery.value.pageSize = 20
  getList()
}

// 过滤后的商品列表
const displayList = computed(() => {
  if (!isSearching.value || !searchKeyword.value.trim()) {
    return list.value
  }
  const keyword = searchKeyword.value.trim().toLowerCase()
  return list.value.filter(item => item.name.toLowerCase().includes(keyword))
})

// 价格格式化
const formatPrice = (price?: number) => {
  if (price === undefined || price === null) {
    return '0.00'
  }
  return price.toFixed(2)
}

// 销量格式化
const formatSale = (sale?: number) => {
  if (!sale) {
    return '0'
  }
  if (sale >= 10000) {
    return (sale / 10000).toFixed(1) + '万+'
  }
  return sale.toString()
}

// 图片
const productPic = (item: PmsProduct) => {
  return item.pic || ''
}

// 显示售价
const displayPrice = (item: PmsProduct) => {
  return item.promotionPrice !== undefined && item.promotionPrice !== null
    ? item.promotionPrice
    : item.price
}

// 是否有促销价
const hasPromotion = (item: PmsProduct) => {
  return item.promotionPrice !== undefined && item.promotionPrice !== null && item.promotionPrice < (item.price || 0)
}

// 打开详情
const handleViewDetail = (item: PmsProduct) => {
  selectedProduct.value = item
  dialogVisible.value = true
}

// 登录/退出
const openLogin = () => {
  loginVisible.value = true
}

const handleLogout = async () => {
  await userStore.userLogout()
  location.reload()
}
</script>

<template>
  <div class="mall-page">
    <!-- 顶部通栏 -->
    <header class="mall-header">
      <div class="header-inner">
        <div class="header-logo" @click="clearSearch">
          <svg-icon icon-class="login-mall" class="logo-icon"></svg-icon>
          <span class="logo-text">商城</span>
        </div>
        <div class="header-search">
          <el-input v-model="searchKeyword" placeholder="搜索商品" class="search-input" clearable
            @keyup.enter="handleSearch">
            <template #append>
              <el-button :icon="Search" class="search-btn" @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
        <div class="header-user">
          <template v-if="!userStore.userInfo.token">
            <el-button type="primary" class="header-login-btn" @click="openLogin">登录</el-button>
          </template>
          <template v-else>
            <el-dropdown trigger="click">
              <div class="header-avatar-wrapper">
                <el-avatar :size="32" :src="userStore.userInfo.avatar" fit="cover" class="header-avatar">
                  {{ (userStore.userInfo.username || 'U').charAt(0).toUpperCase() }}
                </el-avatar>
                <span class="header-username">{{ userStore.userInfo.username }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <router-link to="/" class="dropdown-link">
                    <el-dropdown-item>进入后台</el-dropdown-item>
                  </router-link>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </div>
      </div>
    </header>

    <div class="mall-body">
      <el-row :gutter="20">
        <!-- 左侧分类 -->
        <el-col :lg="5" :md="6" :sm="24" :xs="24" class="main-col">
          <CategorySidebar @select="handleCategorySelect" />
        </el-col>

        <!-- 中间主体 -->
        <el-col :lg="13" :md="12" :sm="24" :xs="24" class="main-col">
          <!-- Banner -->
          <div class="mall-banner">
            <div class="banner-content">
              <div class="banner-icon">
                <el-icon><ShoppingBag /></el-icon>
              </div>
              <div class="banner-text">
                <h3>每日好货推荐</h3>
                <p>精选优质商品，限时特惠不断</p>
              </div>
            </div>
          </div>

          <!-- 商品网格 -->
          <div v-loading="listLoading" class="product-section">
            <div class="section-header">
              <h3 class="section-title">
                <span v-if="listQuery.productCategoryId">分类精选</span>
                <span v-else>猜你喜欢</span>
              </h3>
              <span v-if="searchKeyword" class="search-tag">
                "{{ searchKeyword }}" 搜索结果
                <el-button type="info" link size="small" @click="clearSearch">清除</el-button>
              </span>
            </div>
            <div v-if="displayList.length" class="product-grid">
              <el-row :gutter="16">
                <el-col v-for="item in displayList" :key="item.id" :xs="12" :sm="12" :md="8" :lg="6" :xl="5">
                  <div class="product-card" @click="handleViewDetail(item)">
                    <div class="product-image-wrapper">
                      <el-image :src="productPic(item)" fit="cover" class="product-image">
                        <template #error>
                          <div class="image-placeholder">
                            <el-icon>
                              <Picture />
                            </el-icon>
                            <span>暂无图片</span>
                          </div>
                        </template>
                      </el-image>
                    </div>
                    <div class="product-info">
                      <div class="product-name" :title="item.name">{{ item.name }}</div>
                      <div class="product-price-row">
                        <span class="product-price">￥{{ formatPrice(displayPrice(item)) }}</span>
                        <span v-if="hasPromotion(item)" class="product-original-price">￥{{ formatPrice(item.price) }}</span>
                      </div>
                      <div class="product-meta">
                        <span class="product-sales">已售 {{ formatSale(item.sale) }}</span>
                        <span v-if="item.brandName" class="product-brand">{{ item.brandName }}</span>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <el-empty v-else description="暂无商品" />

            <!-- 分页 -->
            <div v-if="!isSearching && total > 0" class="pagination-wrapper">
              <el-pagination background @size-change="handleSizeChange" @current-change="handleCurrentChange"
                layout="total, sizes, prev, pager, next" :current-page="listQuery.pageNum"
                :page-sizes="[12, 20, 40, 60]" :page-size="listQuery.pageSize" :total="total">
              </el-pagination>
            </div>
          </div>
        </el-col>

        <!-- 右侧用户面板 -->
        <el-col :lg="6" :md="6" :sm="24" :xs="24" class="main-col">
          <UserPanel class="sticky-panel" @login="openLogin" @logout="handleLogout" />
        </el-col>
      </el-row>
    </div>

    <!-- 登录弹窗 -->
    <LoginModal v-model="loginVisible" />

    <!-- 商品详情弹窗 -->
    <el-dialog v-model="dialogVisible" title="商品详情" width="500px" align-center>
      <div v-if="selectedProduct" class="product-detail">
        <el-image :src="productPic(selectedProduct)" fit="contain" class="detail-image">
          <template #error>
            <div class="image-placeholder">
              <el-icon>
                <Picture />
              </el-icon>
              <span>暂无图片</span>
            </div>
          </template>
        </el-image>
        <div class="detail-name">{{ selectedProduct.name }}</div>
        <div class="detail-price-row">
          <span class="detail-price">￥{{ formatPrice(displayPrice(selectedProduct)) }}</span>
          <span v-if="hasPromotion(selectedProduct)" class="detail-original-price">￥{{ formatPrice(selectedProduct.price) }}</span>
        </div>
        <div class="detail-meta">
          <span>销量：{{ formatSale(selectedProduct.sale) }}</span>
          <span v-if="selectedProduct.brandName">品牌：{{ selectedProduct.brandName }}</span>
          <span v-if="selectedProduct.productCategoryName">分类：{{ selectedProduct.productCategoryName }}</span>
        </div>
        <div v-if="selectedProduct.stock" class="detail-stock">库存：{{ selectedProduct.stock }}</div>
        <div v-if="selectedProduct.description" class="detail-desc">{{ selectedProduct.description }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.mall-page {
  min-height: 100vh;
  background-color: #f4f4f4;
}

.mall-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-icon {
  width: 36px;
  height: 36px;
  color: #ff5000;
}

.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #ff5000;
}

.header-search {
  flex: 1;
  max-width: 600px;
  margin: 0 auto;
}

.search-input :deep(.el-input__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.search-input :deep(.el-input-group__append) {
  background-color: #ff5000;
  border-color: #ff5000;
  color: #fff;
  padding: 0;
}

.search-btn {
  color: #fff;
  background-color: transparent;
  border: none;
  padding: 0 20px;
}

.search-btn:hover {
  color: #fff;
  background-color: transparent;
}

.header-user {
  flex-shrink: 0;
  min-width: 100px;
  display: flex;
  justify-content: flex-end;
}

.header-login-btn {
  background-color: #ff5000;
  border-color: #ff5000;
}

.header-login-btn:hover {
  background-color: #e64a00;
  border-color: #e64a00;
}

.header-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.header-avatar {
  background-color: #ff5000;
  color: #fff;
  font-weight: bold;
}

.header-username {
  font-size: 14px;
  color: #333;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.mall-body {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.main-col {
  margin-bottom: 20px;
}

.mall-banner {
  background: linear-gradient(135deg, #ff5000 0%, #ff9000 100%);
  border-radius: 12px;
  padding: 30px;
  color: #fff;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(255, 80, 0, 0.2);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.banner-text h3 {
  margin: 0 0 6px;
  font-size: 22px;
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.product-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.search-tag {
  font-size: 13px;
  color: #666;
}

.product-grid {
  min-height: 300px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 16px;
  border: 1px solid #f2f2f2;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #C0C4CC;
  background: #f5f5f5;
}

.image-placeholder span {
  margin-top: 8px;
  font-size: 12px;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  color: #ff5000;
  font-weight: bold;
}

.product-original-price {
  font-size: 12px;
  color: #C0C4CC;
  text-decoration: line-through;
  margin-left: 8px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.product-brand {
  color: #ff5000;
  background: #fff5f0;
  padding: 2px 6px;
  border-radius: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 20px 0 0;
}

.sticky-panel {
  position: sticky;
  top: 90px;
}

.product-detail {
  padding: 10px;
}

.detail-image {
  width: 100%;
  height: 300px;
  border-radius: 8px;
  background: #f5f5f5;
}

.detail-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 15px 0 10px;
  line-height: 1.4;
}

.detail-price-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 12px;
}

.detail-price {
  font-size: 22px;
  color: #ff5000;
  font-weight: bold;
}

.detail-original-price {
  font-size: 14px;
  color: #C0C4CC;
  text-decoration: line-through;
  margin-left: 10px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}

.detail-stock {
  font-size: 13px;
  color: #67C23A;
  margin-bottom: 10px;
}

.detail-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  padding: 10px;
  background: #F5F7FA;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .header-inner {
    flex-wrap: wrap;
  }

  .header-search {
    order: 3;
    width: 100%;
    max-width: none;
    margin-top: 10px;
  }

  .sticky-panel {
    position: static;
  }
}
</style>
