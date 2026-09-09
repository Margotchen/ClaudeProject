package com.macro.mall.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * 售后申请审核参数
 */
public class OmsReturnApplyHandleParam {
    @NotNull
    @Schema(title = "售后申请ID")
    private Long applyId;

    @NotNull
    @Schema(title = "审核状态：1-通过 2-驳回")
    private Integer status;

    @Schema(title = "处理意见")
    private String handleRemark;

    public Long getApplyId() {
        return applyId;
    }

    public void setApplyId(Long applyId) {
        this.applyId = applyId;
    }

    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
    }

    public String getHandleRemark() {
        return handleRemark;
    }

    public void setHandleRemark(String handleRemark) {
        this.handleRemark = handleRemark;
    }
}
