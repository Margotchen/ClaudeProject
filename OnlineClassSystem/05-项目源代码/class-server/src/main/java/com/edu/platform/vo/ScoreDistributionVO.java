package com.edu.platform.vo;

import lombok.Data;

/**
 * 课程成绩分布视图（按得分率分桶）
 */
@Data
public class ScoreDistributionVO {

    private Long courseId;

    /** 已批改答卷总数 */
    private Integer total;

    /** 得分率 < 60% */
    private Integer low;

    /** 得分率 60% ~ 79% */
    private Integer mid;

    /** 得分率 >= 80% */
    private Integer high;
}
