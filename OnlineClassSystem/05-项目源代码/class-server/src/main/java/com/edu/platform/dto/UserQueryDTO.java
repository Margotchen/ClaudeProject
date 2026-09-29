package com.edu.platform.dto;

import lombok.Data;

/**
 * 用户分页查询请求
 */
@Data
public class UserQueryDTO {

    private Integer pageNum = 1;

    private Integer pageSize = 10;

    /** 关键字：匹配用户名/真实姓名 */
    private String keyword;

    private Long roleId;
}
