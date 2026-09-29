package com.macro.mall.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StatisticsSalesResult {
    @ExcelProperty("日期")
    private String dimension;
    @ExcelProperty("订单量")
    private Integer orderCount;
    @ExcelProperty("销售额")
    private BigDecimal salesAmount;
    @ExcelProperty("客单价")
    private BigDecimal avgOrderValue;
}
