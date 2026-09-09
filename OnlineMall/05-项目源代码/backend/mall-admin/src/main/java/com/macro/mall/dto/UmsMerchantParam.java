package com.macro.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UmsMerchantParam {
    @NotEmpty
    @Schema(title = "店铺名称")
    private String shopName;

    @Schema(title = "联系人")
    private String contactName;

    @Schema(title = "联系电话")
    private String contactPhone;

    @Schema(title = "状态：0->禁用；1->启用")
    private Integer status;
}
