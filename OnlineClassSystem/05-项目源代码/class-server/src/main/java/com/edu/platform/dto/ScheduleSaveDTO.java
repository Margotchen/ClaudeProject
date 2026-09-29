package com.edu.platform.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 新增/编辑直播排课请求
 */
@Data
public class ScheduleSaveDTO {

    private Long id;

    @NotNull(message = "课程不能为空")
    private Long courseId;

    @NotBlank(message = "直播主题不能为空")
    private String liveTitle;

    @NotNull(message = "开播时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @NotNull(message = "时长不能为空")
    @Min(value = 1, message = "时长至少 1 分钟")
    private Integer duration;
}
