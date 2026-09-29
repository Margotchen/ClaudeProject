package com.macro.mall.service;

import com.macro.mall.dto.StatisticsCategoryResult;
import com.macro.mall.dto.StatisticsOverviewResult;
import com.macro.mall.dto.StatisticsProductResult;
import com.macro.mall.dto.StatisticsQueryParam;
import com.macro.mall.dto.StatisticsSalesResult;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

public interface StatisticsService {
    List<StatisticsSalesResult> salesByTime(StatisticsQueryParam param);
    List<StatisticsProductResult> salesByProduct(StatisticsQueryParam param);
    List<StatisticsCategoryResult> salesByCategory(StatisticsQueryParam param);

    /**
     * 首页总览：今日/昨日指标、待处理事务、商品/用户总览、周月统计
     */
    StatisticsOverviewResult overview();

    /**
     * 导出统计报表
     *
     * @param dimension time|product|category
     * @param format    excel|csv
     */
    void export(StatisticsQueryParam param, String dimension, String format, HttpServletResponse response);
}
