package com.macro.mall.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class StatisticsProductResult {
    private Long productId;
    private String productName;
    private Integer saleCount;
    private BigDecimal salesAmount;
    private BigDecimal refundRate;
}
