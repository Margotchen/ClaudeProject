<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Delete, Plus, Minus, Picture } from '@element-plus/icons-vue'
import { getCartListAPI, updateCartQuantityAPI, deleteCartItemAPI } from '@/apis/portalCart'
import { useBuyerStore } from '@/stores/buyer'
import type { CartItem } from '@/types/cart'
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'BuyerCart'
})

const router = useRouter()
const buyerStore = useBuyerStore()
const cartList = ref<(CartItem & { selected?: boolean })[]>([])
const loading = ref(false)

const totalPrice = computed(() => {
  return cartList.value
    .filter(item => item.selected)
    .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
})

const selectedCount = computed(() => cartList.value.filter(item => item.selected).length)

const loadCart = async () => {
  if (!buyerStore.token) return
  loading.value = true
  try {
    const res = await getCartListAPI()
    cartList.value = res.data.map(item => ({ ...item, selected: true }))
  } catch (err) {
    console.error('加载购物车失败:', err)
  } finally {
    loading.value = false
  }
}

const isAllSelected = computed(() => {
  return cartList.value.length > 0 && cartList.value.every(item => item.selected)
})

const isIndeterminate = computed(() => {
  return selectedCount.value > 0 && selectedCount.value < cartList.value.length
})

const toggleAll = () => {
  const newValue = !isAllSelected.value
  cartList.value.forEach(item => (item.selected = newValue))
}

const updateQuantity = async (item: CartItem & { selected?: boolean }, delta: number) => {
  const quantity = (item.quantity || 1) + delta
  if (quantity < 1) return
  try {
    await updateCartQuantityAPI({ id: item.id, quantity })
    item.quantity = quantity
  } catch (err) {
    console.error('修改数量失败:', err)
  }
}

const removeItem = async (id: number) => {
  try {
    await deleteCartItemAPI([id])
    cartList.value = cartList.value.filter(item => item.id !== id)
    ElMessage.success('删除成功')
  } catch (err) {
    console.error('删除失败:', err)
  }
}

const goLogin = () => {
  router.push('/buyer/login')
}

const goConfirm = () => {
  const selectedIds = cartList.value.filter(item => item.selected).map(item => item.id)
  if (selectedIds.length === 0) {
    ElMessage.warning('请选择商品')
    return
  }
  router.push({
    path: '/buyer/order/confirm',
    query: { cartIds: selectedIds.join(',') },
  })
}

onMounted(loadCart)
</script>

<template>
  <div v-loading="loading" class="buyer-cart">
    <div v-if="!buyerStore.token" class="login-tip">
      <p>登录后查看购物车</p>
      <el-button type="primary" @click="goLogin">去登录</el-button>
    </div>

    <template v-else>
      <div v-if="cartList.length === 0" class="empty-tip">购物车还是空的</div>

      <div v-else class="cart-list">
        <div v-for="item in cartList" :key="item.id" class="cart-item">
          <el-checkbox v-model="item.selected" size="large" class="item-check" />

          <div class="item-image">
            <el-image :src="item.productPic || ''" fit="cover" class="item-img">
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                  <span>暂无图片</span>
                </div>
              </template>
            </el-image>
          </div>

          <div class="item-info">
            <h4 class="item-name">{{ item.productName }}</h4>
            <p class="item-attr">{{ item.productAttr || '' }}</p>
            <div class="item-bottom">
              <span class="item-price">¥{{ (item.price || 0).toFixed(2) }}</span>
              <div class="quantity-control">
                <el-icon class="qty-btn" @click="updateQuantity(item, -1)"><Minus /></el-icon>
                <span class="qty-value">{{ item.quantity }}</span>
                <el-icon class="qty-btn" @click="updateQuantity(item, 1)"><Plus /></el-icon>
              </div>
            </div>
          </div>

          <el-icon class="delete-icon" @click="removeItem(item.id)"><Delete /></el-icon>
        </div>
      </div>

      <div v-if="cartList.length > 0" class="cart-footer">
        <div class="select-all">
          <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate" @change="toggleAll">
            全选
          </el-checkbox>
        </div>
        <div class="cart-summary">
          <span class="total-label">合计:</span>
          <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
          <el-button type="primary" class="checkout-btn" @click="goConfirm">结算</el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.buyer-cart {
  min-height: 100%;
  padding: 12px;
  background: $buyer-bg;
  padding-bottom: 70px;
}

.login-tip,
.empty-tip {
  text-align: center;
  padding: 60px 0;
  color: #999;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  @include buyer-card;
  padding: 12px;
  position: relative;
}

.item-check {
  flex-shrink: 0;
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-img {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
  height: 100%;
  font-size: 11px;
  color: #999;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  margin: 0 0 4px;
  font-size: 14px;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-attr {
  margin: 0 0 8px;
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-price {
  color: $buyer-price;
  font-weight: 700;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 2px 6px;
}

.qty-btn {
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.qty-value {
  min-width: 20px;
  text-align: center;
  font-size: 13px;
}

.delete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.cart-footer {
  position: fixed;
  bottom: 56px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 12px;
  background: $buyer-card;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 101;
}

.total-label {
  font-size: 13px;
  color: $buyer-text-1;
}

.total-price {
  color: $buyer-price;
  font-size: 16px;
  font-weight: 700;
  margin-right: 10px;
}

.checkout-btn {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, $buyer-price 0%, #b34e2c 100%);
  border-radius: 20px;
  padding: 0 20px;
}

.checkout-btn:hover {
  color: #fff;
  background: linear-gradient(135deg, #b34e2c 0%, $buyer-price 100%);
}

/* PC 端：结算条吸附在内容区底部 */
@media (min-width: 768px) {
  .buyer-cart {
    padding-bottom: 24px;
  }

  .cart-item {
    padding: 16px 20px;
  }

  .item-image {
    width: 100px;
    height: 100px;
  }

  .item-name {
    font-size: 15px;
  }

  .item-price {
    font-size: 17px;
  }

  .cart-footer {
    position: sticky;
    bottom: 0;
    left: auto;
    right: auto;
    height: 56px;
    margin-top: 12px;
    border-radius: $buyer-radius-card;
    box-shadow: $buyer-shadow-card;
  }

  .total-price {
    font-size: 18px;
  }
}
</style>
