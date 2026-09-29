package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 录播视频视图对象
 */
@Data
public class PlaybackVO {

    private Long id;
    private Long courseId;
    private String courseName;
    private Long scheduleId;
    private String liveTitle;
    private String teacherName;
    private String title;
    private Long fileSize;
    private Integer duration;
    private Integer status;
    private LocalDateTime createTime;
}
