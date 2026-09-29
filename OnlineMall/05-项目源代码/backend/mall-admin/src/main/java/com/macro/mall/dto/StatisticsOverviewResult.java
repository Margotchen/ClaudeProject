package com.macro.mall.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 首页统计总览
 */
@Data
public class StatisticsOverviewResult {
    //今日/昨日指标
    private Integer todayOrderCount;
    private BigDecimal todaySales;
    private Integer yesterdayOrderCount;
    private BigDecimal yesterdaySales;
    //待处理事务
    private Integer pendingPaymentCount;
    private Integer pendingShipmentCount;
    private Integer shippedCount;
    private Integer pendingReturnApplyCount;
    //商品总览
    private Integer productOnCount;
    private Integer productOffCount;
    private Integer lowStockCount;
    private Integer productTotalCount;
    //用户总览
    private Integer memberTodayCount;
    private Integer memberYesterdayCount;
    private Integer memberMonthCount;
    private Integer memberTotalCount;
    //本周/本月统计（含环比基准）
    private Integer weekOrderCount;
    private BigDecimal weekSales;
    private Integer monthOrderCount;
    private BigDecimal monthSales;
    private Integer lastWeekOrderCount;
    private BigDecimal lastWeekSales;
    private Integer lastMonthOrderCount;
    private BigDecimal lastMonthSales;
}
