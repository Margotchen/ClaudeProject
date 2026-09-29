package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 互动消息实体（弹幕/提问/举手/投票）
 */
@Data
@TableName("live_interaction")
public class LiveInteraction {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 直播间（排课）ID */
    private Long scheduleId;

    /** 发送用户ID */
    private Long userId;

    /** 类型：DANMAKU QUESTION HAND_RAISE VOTE_START VOTE_SUBMIT VOTE_END */
    private String msgType;

    /** 业务分组ID（投票ID） */
    private String bizId;

    /** 消息内容 */
    private String content;

    /** JSON 扩展（投票标题/选项/选项下标等） */
    private String extra;

    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
