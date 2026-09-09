package com.macro.mall.service.impl;

import com.alibaba.excel.EasyExcel;
import com.macro.mall.dao.StatisticsDao;
import com.macro.mall.dto.StatisticsCategoryResult;
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
    public void exportSalesExcel(StatisticsQueryParam param, HttpServletResponse response) {
        applyMerchantScope(param);
        List<StatisticsSalesResult> list = statisticsDao.selectSalesByTime(param);
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("sales_" + System.currentTimeMillis(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");
        try (OutputStream out = response.getOutputStream()) {
            EasyExcel.write(out, StatisticsSalesResult.class)
                    .sheet("销售统计")
                    .doWrite(list);
        } catch (IOException e) {
            LOGGER.error("导出销售统计 Excel 失败", e);
            throw new RuntimeException("导出失败", e);
        }
    }

    @Override
    public void exportSalesCsv(StatisticsQueryParam param, HttpServletResponse response) {
        applyMerchantScope(param);
        List<StatisticsSalesResult> list = statisticsDao.selectSalesByTime(param);
        response.setContentType("text/csv;charset=utf-8");
        response.setCharacterEncoding("utf-8");
        String fileName = URLEncoder.encode("sales_" + System.currentTimeMillis(), StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".csv");
        try (OutputStream out = response.getOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             PrintWriter pw = new PrintWriter(writer)) {
            // UTF-8 BOM，避免 Excel 打开中文乱码
            out.write(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
            pw.println("日期,订单量,销售额,客单价");
            for (StatisticsSalesResult item : list) {
                pw.println(String.join(",",
                        escapeCsv(item.getDimension()),
                        String.valueOf(item.getOrderCount()),
                        String.valueOf(item.getSalesAmount()),
                        String.valueOf(item.getAvgOrderValue())));
            }
        } catch (IOException e) {
            LOGGER.error("导出销售统计 CSV 失败", e);
            throw new RuntimeException("导出失败", e);
        }
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
