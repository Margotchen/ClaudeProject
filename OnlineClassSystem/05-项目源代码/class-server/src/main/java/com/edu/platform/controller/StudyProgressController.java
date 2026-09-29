package com.edu.platform.controller;

import com.edu.platform.common.Result;
import com.edu.platform.dto.HeartbeatDTO;
import com.edu.platform.service.StudyProgressService;
import com.edu.platform.vo.MyProgressVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 学习进度接口
 */
@RestController
@RequestMapping("/api/study")
@RequiredArgsConstructor
public class StudyProgressController {

    private final StudyProgressService studyProgressService;

    /** 学习时长心跳上报（直播/录播观看） */
    @PostMapping("/heartbeat")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Void> heartbeat(@Valid @RequestBody HeartbeatDTO dto) {
        studyProgressService.heartbeat(dto);
        return Result.success();
    }

    /** 学生个人学习进度（汇总 + 各课程明细） */
    @GetMapping("/my-progress")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<MyProgressVO> myProgress() {
        return Result.success(studyProgressService.myProgress());
    }
}
