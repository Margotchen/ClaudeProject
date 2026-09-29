import type { PmsProduct } from '@/types/portal'
import portal from './portal'

/**
 * 首页推荐商品
 */
export function getRecommendProductList(params?: { pageNum?: number; pageSize?: number }) {
  return portal<{ list: PmsProduct[]; total: number }>({
    url: '/home/recommendProductList',
    method: 'get',
    params,
  })
}

/**
 * 首页新品推荐
 */
export function getNewProductList(params?: { pageNum?: number; pageSize?: number }) {
  return portal<{ list: PmsProduct[]; total: number }>({
    url: '/home/newProductList',
    method: 'get',
    params,
  })
}

/**
 * 首页人气推荐
 */
export function getHotProductList(params?: { pageNum?: number; pageSize?: number }) {
  return portal<{ list: PmsProduct[]; total: number }>({
    url: '/home/hotProductList',
    method: 'get',
    params,
  })
}
