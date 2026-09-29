package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 录播视频实体
 */
@Data
@TableName("playback_video")
public class PlaybackVideo {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 课程ID */
    private Long courseId;

    /** 排课ID */
    private Long scheduleId;

    /** 直播会话ID */
    private Long sessionId;

    /** 录播标题（默认取直播主题） */
    private String title;

    /** 录制文件名（相对录制根目录，如 live/schedule_2_20260928153000.mp4） */
    private String fileName;

    /** 文件大小（字节） */
    private Long fileSize;

    /** 时长（秒，取会话时长近似值） */
    private Integer duration;

    /** 状态：1-上架 0-下架 */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;
}
