import portal from './portal'
import type { ConfirmOrderResult, PortalOrderDetail } from '@/types/order'

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
 * 生成订单
 */
export function generateOrderAPI(data: {
  cartIds?: number[]
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
