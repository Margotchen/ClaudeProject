import type { CommonResult } from '@/types/common'
import http from '@/utils/http'

export interface StatisticsSalesItem {
  dimension: string
  orderCount: number
  salesAmount: number
  avgOrderValue: number
}

export interface StatisticsProductItem {
  productId: number
  productName: string
  saleCount: number
  salesAmount: number
  refundRate: number
}

export interface StatisticsCategoryItem {
  categoryId: number
  categoryName: string
  orderCount: number
  salesAmount: number
  ratio: number
}

export interface StatisticsQueryParam {
  startTime?: string
  endTime?: string
  groupBy?: string
  productId?: number
  categoryId?: number
}

export function fetchSalesByTimeAPI(params: StatisticsQueryParam) {
  return http<CommonResult<StatisticsSalesItem[]>>({
    url: '/statistics/sales/time',
    method: 'get',
    params,
  })
}

export function fetchSalesByProductAPI(params: StatisticsQueryParam) {
  return http<CommonResult<StatisticsProductItem[]>>({
    url: '/statistics/sales/product',
    method: 'get',
    params,
  })
}

export function fetchSalesByCategoryAPI(params: StatisticsQueryParam) {
  return http<CommonResult<StatisticsCategoryItem[]>>({
    url: '/statistics/sales/category',
    method: 'get',
    params,
  })
}

export function exportSalesExcelAPI(params: StatisticsQueryParam) {
  return http({
    url: '/statistics/export/excel',
    method: 'get',
    params,
    responseType: 'blob',
  })
}

export function exportSalesCsvAPI(params: StatisticsQueryParam) {
  return http({
    url: '/statistics/export/csv',
    method: 'get',
    params,
    responseType: 'blob',
  })
}
