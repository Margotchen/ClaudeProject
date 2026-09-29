package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 学生维度统计视图
 */
@Data
public class StudentStatsVO {

    private Long studentId;

    private String studentName;

    /** 总学习时长（秒） */
    private Long totalSeconds;

    /** 作业提交数 */
    private Integer homeworkSubmitted;

    /** 作业完成率（0~100，提交数/可见作业总数） */
    private Integer homeworkRate;

    /** 考试平均分（已批改） */
    private Integer examAvg;

    private LocalDateTime lastStudyTime;
}
