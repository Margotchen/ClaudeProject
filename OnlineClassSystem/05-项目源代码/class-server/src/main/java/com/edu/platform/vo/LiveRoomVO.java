package com.edu.platform.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 直播房间信息视图（进入教室页时加载）
 */
@Data
public class LiveRoomVO {

    private Long scheduleId;

    private String liveTitle;

    private Long courseId;

    private String courseName;

    private String teacherName;

    /** 排课状态：0-未开始 1-直播中 2-已结束 */
    private Integer scheduleStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    private Integer duration;

    /** 当前会话ID（未开播为 null） */
    private Long sessionId;

    /** 实际开播时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime actualStartTime;

    /** 在线人数 */
    private Integer onlineCount;

    /** 当前用户是否可管理该直播间（开播/结束/发起投票等） */
    private Boolean canManage;

    /** SRS 是否已接入（决定视频区显示真实流还是占位） */
    private Boolean srsEnabled;

    /** 拉流地址（SRS 接入后返回） */
    private String pullUrl;
}
