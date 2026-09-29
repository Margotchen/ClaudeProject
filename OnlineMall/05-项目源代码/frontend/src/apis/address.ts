import portal from './portal'
import type { Address } from '@/types/address'

/**
 * 获取当前会员收货地址列表
 */
export function listAddressAPI() {
  return portal<Address[]>({
    url: '/member/address/list',
    method: 'get',
  })
}

/**
 * 添加收货地址
 */
export function addAddressAPI(data: Address) {
  return portal<number>({
    url: '/member/address/add',
    method: 'post',
    data,
  })
}

/**
 * 修改收货地址（传 defaultStatus=1 即设为默认，后端自动互斥）
 */
export function updateAddressAPI(id: number, data: Address) {
  return portal<number>({
    url: `/member/address/update/${id}`,
    method: 'post',
    data,
  })
}

/**
 * 删除收货地址
 */
export function deleteAddressAPI(id: number) {
  return portal<number>({
    url: `/member/address/delete/${id}`,
    method: 'post',
  })
}
