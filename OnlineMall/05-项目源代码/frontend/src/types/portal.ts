/** 前台商品基础类型 */
export type PmsProduct = {
  id: number
  name: string
  pic: string
  price: number
  promotionPrice?: number
  originalPrice?: number
  sale?: number
  stock?: number
  subTitle?: string
  description?: string
  brandName?: string
  productCategoryName?: string
  publishStatus?: number
  newStatus?: number
  recommandStatus?: number
}

/** 商品分类节点 */
export type PmsProductCategoryNode = {
  id: number
  name: string
  level?: number
  productCount?: number
  children?: PmsProductCategoryNode[]
}

/** 商品详情 */
export type PmsPortalProductDetail = {
  product: PmsProduct
  brand?: unknown
  productAttributeList?: unknown[]
  productAttributeValueList?: unknown[]
  skuStockList?: unknown[]
  productLadderList?: unknown[]
  productFullReductionList?: unknown[]
  couponList?: unknown[]
}

/** 分页数据 */
export type CommonPage<T> = {
  pageNum: number
  pageSize: number
  total: number
  totalPage: number
  list: T[]
}
