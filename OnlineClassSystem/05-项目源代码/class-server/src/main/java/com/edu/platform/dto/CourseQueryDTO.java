package com.edu.platform.dto;

import lombok.Data;

/**
 * 课程分页查询请求
 */
@Data
public class CourseQueryDTO {

    private Integer pageNum = 1;

    private Integer pageSize = 10;

    /** 关键字：匹配课程名称 */
    private String keyword;

    /** 状态：1-上架 0-下架 */
    private Integer status;
}
