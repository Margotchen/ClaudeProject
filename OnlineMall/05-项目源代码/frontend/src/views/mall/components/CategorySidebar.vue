<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getProductCategoryListWithChildrenAPI } from '@/apis/productCate'
import type { PmsProductCategory, PmsProductCategoryExt } from '@/types/productCate'
import { ArrowRight } from '@element-plus/icons-vue'

defineOptions({
  name: 'CategorySidebar'
})

const emit = defineEmits<{
  (e: 'select', categoryId?: number): void
}>()

const categories = ref<PmsProductCategoryExt[]>([])
const loading = ref(false)
const selectedId = ref<number | undefined>(undefined)

const topCategories = computed(() => {
  return categories.value.filter(item => item.parentId === 0 || item.parentId == null)
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await getProductCategoryListWithChildrenAPI()
    categories.value = res.data || []
  } catch (err) {
    console.error('获取分类失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSelect = (category?: PmsProductCategory) => {
  selectedId.value = category?.id
  emit('select', category?.id)
}

const handleSelectAll = () => {
  selectedId.value = undefined
  emit('select', undefined)
}

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div v-loading="loading" class="category-sidebar">
    <div class="category-title">
      <span>商品分类</span>
    </div>
    <div class="category-list">
      <div class="category-item" :class="{ active: selectedId === undefined }" @click="handleSelectAll">
        <span class="category-name">全部商品</span>
        <el-icon class="category-arrow"><ArrowRight /></el-icon>
      </div>
      <div v-for="item in topCategories" :key="item.id" class="category-item"
        :class="{ active: selectedId === item.id }" @click="handleSelect(item)">
        <span class="category-name">{{ item.name }}</span>
        <el-icon class="category-arrow"><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-sidebar {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.category-title {
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #ff5000 0%, #ff9000 100%);
}

.category-list {
  padding: 8px 0;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-item:hover {
  background-color: #fff5f0;
  color: #ff5000;
}

.category-item.active {
  background-color: #fff5f0;
  color: #ff5000;
  font-weight: 600;
}

.category-name {
  font-size: 14px;
}

.category-arrow {
  font-size: 12px;
  color: #c0c0c0;
}

.category-item:hover .category-arrow,
.category-item.active .category-arrow {
  color: #ff5000;
}
</style>
