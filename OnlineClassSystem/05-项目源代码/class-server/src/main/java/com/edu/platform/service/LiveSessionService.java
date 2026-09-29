package com.edu.platform.service;

import com.edu.platform.vo.LiveRoomVO;

/**
 * 直播会话服务
 */
public interface LiveSessionService {

    /**
     * 进入直播间：返回房间信息（排课 + 会话状态 + 在线人数 + 当前用户权限）
     */
    LiveRoomVO getRoomInfo(Long scheduleId);

    /**
     * 开播：排课状态 0→1，创建直播会话
     */
    LiveRoomVO startLive(Long scheduleId);

    /**
     * 结束直播：排课状态 1→2，关闭直播会话
     */
    void endLive(Long scheduleId);

    /**
     * 获取讲师推流地址（SRS 接入后生效）
     */
    String getPushUrl(Long scheduleId);

    /**
     * 获取学生拉流地址（SRS 接入后生效）
     */
    String getPullUrl(Long scheduleId);
}
