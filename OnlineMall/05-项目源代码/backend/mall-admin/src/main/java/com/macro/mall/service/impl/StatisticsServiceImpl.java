package com.macro.mall.service.impl;

import com.alibaba.excel.EasyExcel;
import com.macro.mall.dao.StatisticsDao;
import com.macro.mall.dto.StatisticsCategoryResult;
import com.macro.mall.dto.StatisticsOverviewResult;
import com.macro.mall.dto.StatisticsProductResult;
import com.macro.mall.dto.StatisticsQueryParam;
import com.macro.mall.dto.StatisticsSalesResult;
import com.macro.mall.service.StatisticsService;
import com.macro.mall.util.CurrentMerchantUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class StatisticsServiceImpl implements StatisticsService {
    private static final Logger LOGGER = LoggerFactory.getLogger(StatisticsServiceImpl.class);

    @Autowired
    private StatisticsDao statisticsDao;

    @Override
    public List<StatisticsSalesResult> salesByTime(StatisticsQueryParam param) {
        applyMerchantScope(param);
        return statisticsDao.selectSalesByTime(param);
    }

    @Override
    public List<StatisticsProductResult> salesByProduct(StatisticsQueryParam param) {
        applyMerchantScope(param);
        return statisticsDao.selectSalesByProduct(param);
    }

    @Override
    public List<StatisticsCategoryResult> salesByCategory(StatisticsQueryParam param) {
        applyMerchantScope(param);
        return statisticsDao.selectSalesByCategory(param);
    }

    @Override
    public void export(StatisticsQueryParam param, String dimension, String format, HttpServletResponse response) {
        applyMerchantScope(param);
        String baseName = URLEncoder.encode("statistics_" + dimension + "_" + System.currentTimeMillis(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        if ("csv".equalsIgnoreCase(format)) {
            exportCsv(param, dimension, baseName, response);
        } else {
            exportExcel(param, dimension, baseName, response);
        }
    }

    private void exportExcel(StatisticsQueryParam param, String dimension, String baseName, HttpServletResponse response) {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + baseName + ".xlsx");
        try (OutputStream out = response.getOutputStream()) {
            switch (dimension) {
                case "product":
                    EasyExcel.write(out, StatisticsProductResult.class)
                            .sheet("商品销售统计")
                            .doWrite(statisticsDao.selectSalesByProduct(param));
                    break;
                case "category":
                    EasyExcel.write(out, StatisticsCategoryResult.class)
                            .sheet("类目销售统计")
                            .doWrite(statisticsDao.selectSalesByCategory(param));
                    break;
                default:
                    EasyExcel.write(out, StatisticsSalesResult.class)
                            .sheet("销售统计")
                            .doWrite(statisticsDao.selectSalesByTime(param));
            }
        } catch (IOException e) {
            LOGGER.error("导出统计 Excel 失败", e);
            throw new RuntimeException("导出失败", e);
        }
    }

    private void exportCsv(StatisticsQueryParam param, String dimension, String baseName, HttpServletResponse response) {
        response.setContentType("text/csv;charset=utf-8");
        response.setCharacterEncoding("utf-8");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + baseName + ".csv");
        try (OutputStream out = response.getOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             PrintWriter pw = new PrintWriter(writer)) {
            // UTF-8 BOM，避免 Excel 打开中文乱码
            out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
            switch (dimension) {
                case "product": {
                    pw.println("商品ID,商品名称,销量,销售额,退款率(%)");
                    for (StatisticsProductResult item : statisticsDao.selectSalesByProduct(param)) {
                        pw.println(String.join(",",
                                String.valueOf(item.getProductId()),
                                escapeCsv(item.getProductName()),
                                String.valueOf(item.getSaleCount()),
                                String.valueOf(item.getSalesAmount()),
                                String.valueOf(item.getRefundRate())));
                    }
                    break;
                }
                case "category": {
                    pw.println("类目ID,类目名称,订单量,销售额,占比(%)");
                    for (StatisticsCategoryResult item : statisticsDao.selectSalesByCategory(param)) {
                        pw.println(String.join(",",
                                String.valueOf(item.getCategoryId()),
                                escapeCsv(item.getCategoryName()),
                                String.valueOf(item.getOrderCount()),
                                String.valueOf(item.getSalesAmount()),
                                String.valueOf(item.getRatio())));
                    }
                    break;
                }
                default: {
                    pw.println("日期,订单量,销售额,客单价");
                    for (StatisticsSalesResult item : statisticsDao.selectSalesByTime(param)) {
                        pw.println(String.join(",",
                                escapeCsv(item.getDimension()),
                                String.valueOf(item.getOrderCount()),
                                String.valueOf(item.getSalesAmount()),
                                String.valueOf(item.getAvgOrderValue())));
                    }
                }
            }
        } catch (IOException e) {
            LOGGER.error("导出统计 CSV 失败", e);
            throw new RuntimeException("导出失败", e);
        }
    }

    @Override
    public StatisticsOverviewResult overview() {
        Long shopId = CurrentMerchantUtil.getCurrentShopId();
        StatisticsOverviewResult result = statisticsDao.selectOrderOverview(shopId);
        if (result == null) {
            result = new StatisticsOverviewResult();
        }
        result.setPendingReturnApplyCount(statisticsDao.selectPendingReturnApplyCount(shopId));
        StatisticsOverviewResult productPart = statisticsDao.selectProductOverview(shopId);
        if (productPart != null) {
            result.setProductOnCount(productPart.getProductOnCount());
            result.setProductOffCount(productPart.getProductOffCount());
            result.setLowStockCount(productPart.getLowStockCount());
            result.setProductTotalCount(productPart.getProductTotalCount());
        }
        StatisticsOverviewResult memberPart = statisticsDao.selectMemberOverview(shopId);
        if (memberPart != null) {
            result.setMemberTodayCount(memberPart.getMemberTodayCount());
            result.setMemberYesterdayCount(memberPart.getMemberYesterdayCount());
            result.setMemberMonthCount(memberPart.getMemberMonthCount());
            result.setMemberTotalCount(memberPart.getMemberTotalCount());
        }
        return result;
    }

    private void applyMerchantScope(StatisticsQueryParam param) {
        Long shopId = CurrentMerchantUtil.getCurrentShopId();
        if (shopId != null) {
            param.setShopId(shopId);
        }
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
