import portal from './portal'
import type { ConfirmOrderResult, OmsOrderLogisticsTrace, PortalOrderDetail } from '@/types/order'
import type { OmsOrderReturnApply, ReturnApplyCreateParam } from '@/types/returnApply'

/**
 * 根据购物车商品生成确认单
 */
export function generateConfirmOrderAPI(cartIds: number[]) {
  return portal<ConfirmOrderResult>({
    url: '/order/generateConfirmOrder',
    method: 'post',
    data: cartIds,
  })
}

/**
 * 立即购买：根据商品+规格+数量生成确认单
 */
export function generateDirectConfirmOrderAPI(data: {
  productId: number
  productSkuId?: number
  quantity: number
}) {
  return portal<ConfirmOrderResult>({
    url: '/order/generateConfirmOrder/direct',
    method: 'post',
    data,
  })
}

/**
 * 生成订单
 */
export function generateOrderAPI(data: {
  cartIds?: number[]
  productId?: number
  productSkuId?: number
  quantity?: number
  couponId?: number
  memberReceiveAddressId?: number
  payType: number
}) {
  return portal<unknown>({
    url: '/order/generateOrder',
    method: 'post',
    data,
  })
}

/**
 * 获取订单列表
 */
export function getPortalOrderListAPI(params: { status: number; pageNum?: number; pageSize?: number }) {
  return portal<{ list: PortalOrderDetail[]; total: number }>({
    url: '/order/list',
    method: 'get',
    params,
  })
}

/**
 * 取消订单
 */
export function cancelPortalOrderAPI(orderId: number) {
  return portal<unknown>({
    url: '/order/cancelUserOrder',
    method: 'post',
    params: { orderId },
  })
}

/**
 * 确认收货
 */
export function confirmPortalReceiveAPI(orderId: number) {
  return portal<unknown>({
    url: '/order/confirmReceiveOrder',
    method: 'post',
    params: { orderId },
  })
}

/**
 * 模拟支付成功回调（订单状态：待付款->待发货）
 */
export function payOrderAPI(orderId: number, payType = 1) {
  return portal<unknown>({
    url: '/order/paySuccess',
    method: 'post',
    params: { orderId, payType },
  })
}

/**
 * 获取订单详情
 */
export function getPortalOrderDetailAPI(orderId: number) {
  return portal<PortalOrderDetail>({
    url: `/order/detail/${orderId}`,
    method: 'get',
  })
}

/**
 * 删除订单（仅已完成/已关闭可删）
 */
export function deletePortalOrderAPI(orderId: number) {
  return portal<unknown>({
    url: '/order/deleteOrder',
    method: 'post',
    params: { orderId },
  })
}

/**
 * 提交退货申请
 */
export function createReturnApplyAPI(data: ReturnApplyCreateParam) {
  return portal<unknown>({
    url: '/returnApply/create',
    method: 'post',
    data,
  })
}

/**
 * 获取订单物流轨迹
 */
export function getLogisticsTraceAPI(orderId: number) {
  return portal<OmsOrderLogisticsTrace[]>({
    url: `/order/logisticsTrace/${orderId}`,
    method: 'get',
  })
}

/**
 * 我的售后申请列表
 */
export function getReturnApplyListAPI(params: { pageNum?: number; pageSize?: number }) {
  return portal<{ list: OmsOrderReturnApply[]; total: number }>({
    url: '/returnApply/list',
    method: 'get',
    params,
  })
}

/**
 * 售后申请详情
 */
export function getReturnApplyDetailAPI(id: number) {
  return portal<OmsOrderReturnApply>({
    url: `/returnApply/${id}`,
    method: 'get',
  })
}
