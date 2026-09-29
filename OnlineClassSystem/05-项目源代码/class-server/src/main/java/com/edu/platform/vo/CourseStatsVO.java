package com.edu.platform.vo;

import lombok.Data;

/**
 * 课程维度统计视图
 */
@Data
public class CourseStatsVO {

    private Long courseId;

    private String courseName;

    private String teacherName;

    /** 学习总时长（秒） */
    private Long totalSeconds;

    /** 参与学生数（有任一观看/提交/答卷行为） */
    private Integer studentCount;

    /** 作业总数 */
    private Integer homeworkTotal;

    /** 作业提交总数 */
    private Integer homeworkSubmitted;

    /** 考试平均分（已批改答卷） */
    private Integer examAvg;
}
