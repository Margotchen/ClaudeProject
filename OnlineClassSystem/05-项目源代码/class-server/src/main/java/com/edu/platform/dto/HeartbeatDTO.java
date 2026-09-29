package com.edu.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 学习时长心跳上报
 */
@Data
public class HeartbeatDTO {

    @NotNull(message = "课程ID不能为空")
    private Long courseId;

    /** 场景：LIVE-直播 PLAYBACK-录播 */
    @NotNull(message = "上报场景不能为空")
    private String scene;

    /** 本次上报秒数（服务端钳制 1~60） */
    private Integer seconds;
}
