package com.macro.mall.portal.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 立即购买参数
 */
@Data
public class DirectBuyParam {
    @Schema(title = "商品ID")
    private Long productId;
    @Schema(title = "商品SKU ID")
    private Long productSkuId;
    @Schema(title = "购买数量")
    private Integer quantity;
}
