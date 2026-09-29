package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 直播排课实体
 */
@Data
@TableName("live_schedule")
public class LiveSchedule {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long courseId;

    /** 直播主题 */
    private String liveTitle;

    /** 计划开播时间 */
    private LocalDateTime startTime;

    /** 时长（分钟） */
    private Integer duration;

    /** 状态：0-未开始 1-直播中 2-已结束 */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
