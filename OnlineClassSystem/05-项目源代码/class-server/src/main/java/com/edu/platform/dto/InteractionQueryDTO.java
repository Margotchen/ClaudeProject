package com.edu.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 互动消息分页查询参数
 */
@Data
public class InteractionQueryDTO {

    @NotNull(message = "排课ID不能为空")
    private Long scheduleId;

    /** 消息类型筛选（可选） */
    private String msgType;

    private Integer pageNum = 1;

    private Integer pageSize = 50;
}
