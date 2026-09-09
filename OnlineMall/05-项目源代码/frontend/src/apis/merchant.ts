import http from '@/utils/http'

export function fetchList(params: any) {
  return http({
    url: '/merchant/list',
    method: 'get',
    params,
  })
}

export function createMerchant(data: any) {
  return http({
    url: '/merchant/create',
    method: 'post',
    data,
  })
}

export function updateMerchant(id: number, data: any) {
  return http({
    url: `/merchant/update/${id}`,
    method: 'post',
    data,
  })
}

export function deleteMerchant(id: number) {
  return http({
    url: `/merchant/delete/${id}`,
    method: 'post',
  })
}
