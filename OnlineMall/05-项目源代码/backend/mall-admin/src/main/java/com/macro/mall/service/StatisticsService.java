package com.macro.mall.service;

import com.macro.mall.dto.StatisticsCategoryResult;
import com.macro.mall.dto.StatisticsProductResult;
import com.macro.mall.dto.StatisticsQueryParam;
import com.macro.mall.dto.StatisticsSalesResult;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

public interface StatisticsService {
    List<StatisticsSalesResult> salesByTime(StatisticsQueryParam param);
    List<StatisticsProductResult> salesByProduct(StatisticsQueryParam param);
    List<StatisticsCategoryResult> salesByCategory(StatisticsQueryParam param);
    void exportSalesExcel(StatisticsQueryParam param, HttpServletResponse response);
    void exportSalesCsv(StatisticsQueryParam param, HttpServletResponse response);
}
