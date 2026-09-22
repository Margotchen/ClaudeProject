import type { CommonPage, PmsPortalProductDetail, PmsProduct, PmsProductCategoryNode } from '@/types/portal'
import portal from './portal'

/**
 * 商品综合搜索
 */
export function searchProductAPI(params: {
  keyword?: string
  brandId?: number
  productCategoryId?: number
  pageNum?: number
  pageSize?: number
  sort?: number
}) {
  return portal<CommonPage<PmsProduct>>({
    url: '/product/search',
    method: 'get',
    params,
  })
}

/**
 * 商品分类树
 */
export function getCategoryTreeAPI() {
  return portal<PmsProductCategoryNode[]>({
    url: '/product/categoryTreeList',
    method: 'get',
  })
}

/**
 * 商品详情
 */
export function getProductDetailAPI(id: number) {
  return portal<PmsPortalProductDetail>({
    url: `/product/detail/${id}`,
    method: 'get',
  })
}
