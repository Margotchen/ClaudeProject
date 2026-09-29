package com.macro.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.Date;

@Data
public class StatisticsQueryParam {
    @Schema(title = "开始时间")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date startTime;
    @Schema(title = "结束时间")
    @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private Date endTime;
    @Schema(title = "时间粒度：day/week/month")
    private String groupBy;
    @Schema(title = "商家ID")
    private Long shopId;
    @Schema(title = "商品ID")
    private Long productId;
    @Schema(title = "类目ID")
    private Long categoryId;
}
