package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 考试实体
 */
@Data
@TableName("exam")
public class Exam {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 课程ID */
    private Long courseId;

    /** 考试标题 */
    private String title;

    /** 题目JSON：[{type:CHOICE/JUDGE/ESSAY,stem,options,answer,score}] */
    private String questions;

    /** 答题时长（分钟） */
    private Integer duration;

    /** 考试窗口开始时间 */
    private LocalDateTime startTime;

    /** 考试窗口截止时间 */
    private LocalDateTime endTime;

    /** 总分（各题分值之和） */
    private Integer totalScore;

    /** 创建人ID */
    private Long creatorId;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
