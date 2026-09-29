package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 作业列表/详情视图
 */
@Data
public class HomeworkVO {

    private Long id;

    private Long courseId;

    private String courseName;

    private String title;

    private String content;

    private LocalDateTime deadline;

    private String creatorName;

    private LocalDateTime createTime;

    /** 提交总数（管理视角） */
    private Integer submissionCount;

    /** 已批改数（管理视角） */
    private Integer gradedCount;

    /** 我的提交状态（学生视角）：null-未提交 0-待批改 1-已批改 */
    private Integer myStatus;

    /** 我的得分（学生视角） */
    private Integer myScore;
}
