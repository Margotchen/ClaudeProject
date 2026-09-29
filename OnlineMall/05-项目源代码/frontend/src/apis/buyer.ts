import type { BuyerLoginParam, BuyerLoginResult, BuyerInfo, BuyerRegisterParam } from '@/types/buyer'
import portal from './portal'

/**
 * 买家登录
 */
export function buyerLoginAPI(data: BuyerLoginParam) {
  return portal<BuyerLoginResult>({
    url: '/sso/login',
    method: 'post',
    params: data,
  })
}

/**
 * 买家注册
 */
export function registerBuyerAPI(data: BuyerRegisterParam) {
  return portal<unknown>({
    url: '/sso/register',
    method: 'post',
    params: data,
  })
}

/**
 * 获取短信验证码
 */
export function getAuthCodeAPI(telephone: string) {
  return portal<unknown>({
    url: '/sso/getAuthCode',
    method: 'get',
    params: { telephone },
  })
}

/**
 * 获取当前买家/会员信息
 */
export function getBuyerInfoAPI() {
  return portal<BuyerInfo>({
    url: '/sso/info',
    method: 'get',
  })
}
