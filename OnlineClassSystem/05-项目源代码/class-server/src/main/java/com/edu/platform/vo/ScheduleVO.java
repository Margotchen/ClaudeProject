package com.edu.platform.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 直播排课视图对象（含课程名、讲师名）
 */
@Data
public class ScheduleVO {

    private Long id;

    private Long courseId;

    private String courseName;

    private String teacherName;

    private String liveTitle;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    /** 时长（分钟） */
    private Integer duration;

    /** 计划结束时间（startTime + duration） */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;

    /** 状态：0-未开始 1-直播中 2-已结束 */
    private Integer status;
}
