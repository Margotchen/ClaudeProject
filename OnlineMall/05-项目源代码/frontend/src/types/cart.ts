/** 购物车项 */
export type CartItem = {
  id: number
  productId: number
  productSkuId?: number
  memberId?: number
  quantity: number
  price: number
  productPic?: string
  productName: string
  productSubTitle?: string
  productSkuCode?: string
  memberNickname?: string
  createDate?: string
  modifyDate?: string
  deleteStatus?: number
  productCategoryId?: number
  productBrand?: string
  productSn?: string
  productAttr?: string
}
