package com.edu.platform.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 互动消息视图
 */
@Data
public class InteractionVO {

    private Long id;

    private Long scheduleId;

    private String msgType;

    private String bizId;

    private Long userId;

    private String realName;

    private String roleCode;

    private String content;

    /** JSON 扩展字符串 */
    private String extra;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
