package com.edu.platform.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.edu.platform.common.PageResult;
import com.edu.platform.common.Result;
import com.edu.platform.dto.ScheduleQueryDTO;
import com.edu.platform.dto.ScheduleSaveDTO;
import com.edu.platform.service.LiveScheduleService;
import com.edu.platform.vo.ScheduleVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 直播排课接口
 */
@RestController
@RequestMapping("/api/live/schedule")
@RequiredArgsConstructor
public class LiveScheduleController {

    private final LiveScheduleService liveScheduleService;

    @GetMapping("/page")
    public Result<PageResult<ScheduleVO>> page(ScheduleQueryDTO query) {
        Page<ScheduleVO> page = liveScheduleService.pageSchedules(query);
        return Result.success(PageResult.of(page));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> create(@Valid @RequestBody ScheduleSaveDTO dto) {
        liveScheduleService.createSchedule(dto);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody ScheduleSaveDTO dto) {
        dto.setId(id);
        liveScheduleService.updateSchedule(dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> delete(@PathVariable Long id) {
        liveScheduleService.deleteSchedule(id);
        return Result.success();
    }
}
