package com.macro.mall.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class StatisticsCategoryResult {
    private Long categoryId;
    private String categoryName;
    private Integer orderCount;
    private BigDecimal salesAmount;
    private Double ratio;
}
