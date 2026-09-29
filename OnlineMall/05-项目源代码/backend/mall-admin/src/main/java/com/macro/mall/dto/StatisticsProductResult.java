package com.macro.mall.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class StatisticsProductResult {
    @ExcelProperty("商品ID")
    private Long productId;
    @ExcelProperty("商品名称")
    private String productName;
    @ExcelProperty("销量")
    private Integer saleCount;
    @ExcelProperty("销售额")
    private BigDecimal salesAmount;
    @ExcelProperty("退款率(%)")
    private BigDecimal refundRate;
}
