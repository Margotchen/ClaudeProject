package com.edu.platform.dto;

import lombok.Data;

/**
 * 作业批改请求
 */
@Data
public class HomeworkGradeDTO {

    /** 提交记录ID */
    private Long submissionId;

    private Integer score;

    private String comment;
}
