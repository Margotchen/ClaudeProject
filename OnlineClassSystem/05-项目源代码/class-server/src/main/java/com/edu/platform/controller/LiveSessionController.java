package com.edu.platform.controller;

import com.edu.platform.common.Result;
import com.edu.platform.service.LiveSessionService;
import com.edu.platform.vo.LiveRoomVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 直播会话接口（开播/结束/房间信息/推拉流地址）
 */
@RestController
@RequestMapping("/api/live/session")
@RequiredArgsConstructor
public class LiveSessionController {

    private final LiveSessionService liveSessionService;

    @GetMapping("/room/{scheduleId}")
    public Result<LiveRoomVO> roomInfo(@PathVariable Long scheduleId) {
        return Result.success(liveSessionService.getRoomInfo(scheduleId));
    }

    @PostMapping("/start/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<LiveRoomVO> start(@PathVariable Long scheduleId) {
        return Result.success(liveSessionService.startLive(scheduleId));
    }

    @PostMapping("/end/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> end(@PathVariable Long scheduleId) {
        liveSessionService.endLive(scheduleId);
        return Result.success();
    }

    @GetMapping("/push-url/{scheduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<String> pushUrl(@PathVariable Long scheduleId) {
        return Result.success(liveSessionService.getPushUrl(scheduleId));
    }

    @GetMapping("/pull-url/{scheduleId}")
    public Result<String> pullUrl(@PathVariable Long scheduleId) {
        return Result.success(liveSessionService.getPullUrl(scheduleId));
    }
}
