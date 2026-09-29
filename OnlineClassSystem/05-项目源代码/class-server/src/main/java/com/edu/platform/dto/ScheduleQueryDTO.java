package com.edu.platform.dto;

import lombok.Data;

/**
 * 直播排课查询请求
 */
@Data
public class ScheduleQueryDTO {

    private Integer pageNum = 1;

    private Integer pageSize = 10;

    private Long courseId;

    /** 开播日期范围（yyyy-MM-dd） */
    private String startDate;

    private String endDate;

    /** 状态：0-未开始 1-直播中 2-已结束 */
    private Integer status;
}
