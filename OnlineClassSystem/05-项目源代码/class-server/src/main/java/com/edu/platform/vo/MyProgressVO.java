package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 学生个人学习进度视图
 */
@Data
public class MyProgressVO {

    /** 总学习时长（秒） */
    private Integer totalSeconds;

    /** 作业完成率（0~100） */
    private Integer homeworkRate;

    /** 考试平均分（已批改答卷） */
    private Integer examAvg;

    /** 各课程进度明细 */
    private List<CourseProgress> courses;

    @Data
    public static class CourseProgress {

        private Long courseId;

        private String courseName;

        private Integer liveSeconds;

        private Integer playbackSeconds;

        /** 该课程作业总数 */
        private Integer homeworkTotal;

        /** 我已提交数 */
        private Integer homeworkSubmitted;

        /** 该课程我的考试平均分 */
        private Integer examAvg;

        private LocalDateTime lastStudyTime;
    }
}
