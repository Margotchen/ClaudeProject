import portal from './portal'
import type { CartItem } from '@/types/cart'

/**
 * 添加商品到购物车
 */
export function addToCartAPI(data: { productId: number; productSkuId?: number; quantity: number }) {
  return portal<number>({
    url: '/cart/add',
    method: 'post',
    data,
  })
}

/**
 * 获取购物车列表
 */
export function getCartListAPI() {
  return portal<CartItem[]>({
    url: '/cart/list',
    method: 'get',
  })
}

/**
 * 修改购物车商品数量
 */
export function updateCartQuantityAPI(params: { id: number; quantity: number }) {
  return portal<number>({
    url: '/cart/update/quantity',
    method: 'get',
    params,
  })
}

/**
 * 删除购物车商品
 */
export function deleteCartItemAPI(ids: number[]) {
  return portal<number>({
    url: '/cart/delete',
    method: 'post',
    params: { ids },
  })
}
