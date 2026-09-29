package com.macro.mall.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StatisticsCategoryResult {
    @ExcelProperty("类目ID")
    private Long categoryId;
    @ExcelProperty("类目名称")
    private String categoryName;
    @ExcelProperty("订单量")
    private Integer orderCount;
    @ExcelProperty("销售额")
    private BigDecimal salesAmount;
    @ExcelProperty("占比(%)")
    private Double ratio;
}
