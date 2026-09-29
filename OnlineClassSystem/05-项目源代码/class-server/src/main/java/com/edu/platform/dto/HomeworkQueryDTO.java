package com.edu.platform.dto;

import lombok.Data;

/**
 * 作业分页查询请求
 */
@Data
public class HomeworkQueryDTO {

    private Integer pageNum = 1;

    private Integer pageSize = 10;

    /** 课程ID筛选 */
    private Long courseId;

    /** 关键字：匹配作业标题 */
    private String keyword;
}
