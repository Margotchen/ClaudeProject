package com.macro.mall.dao;

import com.macro.mall.dto.StatisticsOverviewResult;
import com.macro.mall.dto.StatisticsQueryParam;
import com.macro.mall.dto.StatisticsSalesResult;
import com.macro.mall.dto.StatisticsProductResult;
import com.macro.mall.dto.StatisticsCategoryResult;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface StatisticsDao {
    List<StatisticsSalesResult> selectSalesByTime(@Param("param") StatisticsQueryParam param);
    List<StatisticsProductResult> selectSalesByProduct(@Param("param") StatisticsQueryParam param);
    List<StatisticsCategoryResult> selectSalesByCategory(@Param("param") StatisticsQueryParam param);

    /**
     * 首页总览：订单侧指标（今日/昨日/本周/上周/本月/上月、待处理计数）
     */
    StatisticsOverviewResult selectOrderOverview(@Param("shopId") Long shopId);

    /**
     * 首页总览：待处理售后申请数
     */
    Integer selectPendingReturnApplyCount(@Param("shopId") Long shopId);

    /**
     * 首页总览：商品总览（上架/下架/库存预警/总数）
     */
    StatisticsOverviewResult selectProductOverview(@Param("shopId") Long shopId);

    /**
     * 首页总览：会员总览；shopId 非空时只统计在该店有订单的会员
     */
    StatisticsOverviewResult selectMemberOverview(@Param("shopId") Long shopId);
}
