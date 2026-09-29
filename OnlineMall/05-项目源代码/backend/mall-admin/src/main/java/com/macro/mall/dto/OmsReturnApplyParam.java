package com.macro.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 用户发起售后申请参数
 */
public class OmsReturnApplyParam {
    @NotNull
    @Schema(title = "订单ID")
    private Long orderId;

    @NotNull
    @Schema(title = "售后类型：1-退货 2-退款")
    private Integer returnType;

    @NotEmpty
    @Schema(title = "售后原因")
    private String reason;

    @Schema(title = "凭证图片URL列表")
    private List<String> proofImages;

    @Schema(title = "描述")
    private String description;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Integer getReturnType() {
        return returnType;
    }

    public void setReturnType(Integer returnType) {
        this.returnType = returnType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public List<String> getProofImages() {
        return proofImages;
    }

    public void setProofImages(List<String> proofImages) {
        this.proofImages = proofImages;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
