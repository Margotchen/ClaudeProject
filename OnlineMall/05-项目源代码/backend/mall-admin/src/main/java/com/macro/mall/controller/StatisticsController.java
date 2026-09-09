package com.macro.mall.controller;

import com.macro.mall.common.api.CommonResult;
import com.macro.mall.dto.StatisticsCategoryResult;
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

    @Operation(summary = "导出 Excel")
    @RequestMapping(value = "/export/excel", method = RequestMethod.GET)
    public void exportExcel(StatisticsQueryParam param, HttpServletResponse response) {
        statisticsService.exportSalesExcel(param, response);
    }

    @Operation(summary = "导出 CSV")
    @RequestMapping(value = "/export/csv", method = RequestMethod.GET)
    public void exportCsv(StatisticsQueryParam param, HttpServletResponse response) {
        statisticsService.exportSalesCsv(param, response);
    }
}
