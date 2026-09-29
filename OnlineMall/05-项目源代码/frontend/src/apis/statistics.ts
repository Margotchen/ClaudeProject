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

export interface StatisticsOverviewItem {
  todayOrderCount: number
  todaySales: number
  yesterdayOrderCount: number
  yesterdaySales: number
  pendingPaymentCount: number
  pendingShipmentCount: number
  shippedCount: number
  pendingReturnApplyCount: number
  productOnCount: number
  productOffCount: number
  lowStockCount: number
  productTotalCount: number
  memberTodayCount: number
  memberYesterdayCount: number
  memberMonthCount: number
  memberTotalCount: number
  weekOrderCount: number
  weekSales: number
  monthOrderCount: number
  monthSales: number
  lastWeekOrderCount: number
  lastWeekSales: number
  lastMonthOrderCount: number
  lastMonthSales: number
}

export function fetchOverviewAPI() {
  return http<CommonResult<StatisticsOverviewItem>>({
    url: '/statistics/overview',
    method: 'get',
  })
}

/**
 * 导出统计报表
 * @param params.dimension time|product|category
 * @param params.format excel|csv
 */
export function exportStatisticsAPI(params: StatisticsQueryParam & { dimension: string; format: string }) {
  return http({
    url: '/statistics/export',
    method: 'get',
    params,
    responseType: 'blob',
  })
}
