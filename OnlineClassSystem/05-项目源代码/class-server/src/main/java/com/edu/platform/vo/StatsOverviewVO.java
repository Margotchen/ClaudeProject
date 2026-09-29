package com.edu.platform.vo;

import lombok.Data;

/**
 * 统计总览视图
 */
@Data
public class StatsOverviewVO {

    /** 课程总数 */
    private Integer courseCount;

    /** 参与学生总数（有任一学习行为） */
    private Integer studentCount;

    /** 总学习时长（秒） */
    private Long totalSeconds;

    /** 作业提交率（0~100，提交数/作业数×学生数的近似口径见实现注释） */
    private Integer homeworkRate;

    /** 考试平均分（已批改） */
    private Integer examAvg;
}
