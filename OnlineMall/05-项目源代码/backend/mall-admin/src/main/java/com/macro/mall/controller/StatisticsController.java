package com.macro.mall.controller;

import com.macro.mall.common.api.CommonResult;
import com.macro.mall.dto.StatisticsCategoryResult;
import com.macro.mall.dto.StatisticsOverviewResult;
import com.macro.mall.dto.StatisticsProductResult;
import com.macro.mall.dto.StatisticsQueryParam;
import com.macro.mall.dto.StatisticsSalesResult;
import com.macro.mall.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Controller
@RequestMapping("/statistics")
@Tag(name = "StatisticsController", description = "统计报表")
public class StatisticsController {
    @Autowired
    private StatisticsService statisticsService;

    @Operation(summary = "按时间统计")
    @RequestMapping(value = "/sales/time", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<StatisticsSalesResult>> salesByTime(StatisticsQueryParam param) {
        return CommonResult.success(statisticsService.salesByTime(param));
    }

    @Operation(summary = "按商品统计")
    @RequestMapping(value = "/sales/product", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<StatisticsProductResult>> salesByProduct(StatisticsQueryParam param) {
        return CommonResult.success(statisticsService.salesByProduct(param));
    }

    @Operation(summary = "按类目统计")
    @RequestMapping(value = "/sales/category", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<List<StatisticsCategoryResult>> salesByCategory(StatisticsQueryParam param) {
        return CommonResult.success(statisticsService.salesByCategory(param));
    }

    @Operation(summary = "首页总览")
    @RequestMapping(value = "/overview", method = RequestMethod.GET)
    @ResponseBody
    public CommonResult<StatisticsOverviewResult> overview() {
        return CommonResult.success(statisticsService.overview());
    }

    @Operation(summary = "导出统计报表")
    @RequestMapping(value = "/export", method = RequestMethod.GET)
    public void export(StatisticsQueryParam param,
                       @RequestParam(value = "dimension", defaultValue = "time") String dimension,
                       @RequestParam(value = "format", defaultValue = "excel") String format,
                       HttpServletResponse response) {
        statisticsService.export(param, dimension, format, response);
    }
}
