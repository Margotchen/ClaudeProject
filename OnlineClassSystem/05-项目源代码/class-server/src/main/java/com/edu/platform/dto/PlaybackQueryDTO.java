package com.edu.platform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 录播分页查询参数
 */
@Data
public class PlaybackQueryDTO {

    @Min(1)
    private Integer pageNum = 1;

    @Min(1)
    @Max(100)
    private Integer pageSize = 10;

    /** 按课程筛选 */
    private Long courseId;

    /** 按状态筛选：1-上架 0-下架 */
    private Integer status;
}
