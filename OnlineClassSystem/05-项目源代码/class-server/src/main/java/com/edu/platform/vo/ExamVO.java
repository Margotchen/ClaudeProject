package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 考试列表视图
 */
@Data
public class ExamVO {

    private Long id;

    private Long courseId;

    private String courseName;

    private String title;

    /** 答题时长（分钟） */
    private Integer duration;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer totalScore;

    /** 题目数 */
    private Integer questionCount;

    private String creatorName;

    private LocalDateTime createTime;

    /** 答卷总数（管理视角） */
    private Integer recordCount;

    /** 我的最近一次成绩（学生视角，null 表示未参加） */
    private Integer myScore;

    /** 我的最近一次答卷状态（学生视角）：0-答题中 1-待批改 2-已批改 */
    private Integer myStatus;
}
