package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 学习进度实体（观看时长累计）
 */
@Data
@TableName("study_progress")
public class StudyProgress {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 学生ID */
    private Long studentId;

    /** 课程ID */
    private Long courseId;

    /** 直播观看时长（秒） */
    private Integer liveSeconds;

    /** 录播观看时长（秒） */
    private Integer playbackSeconds;

    /** 最近学习时间 */
    private LocalDateTime lastStudyTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
