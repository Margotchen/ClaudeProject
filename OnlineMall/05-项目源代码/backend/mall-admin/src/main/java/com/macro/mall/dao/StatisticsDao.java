package com.macro.mall.dao;

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
}
