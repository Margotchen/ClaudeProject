package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 作业提交记录视图
 */
@Data
public class HomeworkSubmissionVO {

    private Long id;

    private Long homeworkId;

    private Long studentId;

    private String studentName;

    private String content;

    private String attachmentName;

    private String attachmentPath;

    private LocalDateTime submitTime;

    private Integer score;

    private String comment;

    private String graderName;

    private LocalDateTime gradeTime;

    /** 状态：0-待批改 1-已批改 */
    private Integer status;
}
