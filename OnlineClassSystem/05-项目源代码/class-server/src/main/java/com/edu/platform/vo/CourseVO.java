package com.edu.platform.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 课程视图对象（含讲师姓名）
 */
@Data
public class CourseVO {

    private Long id;

    private String courseName;

    private String description;

    private Long teacherId;

    private String teacherName;

    private String coverUrl;

    private String syllabus;

    private String targetAudience;

    private Integer status;

    /** 关联的直播场次数量 */
    private Long scheduleCount;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
