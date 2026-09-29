package com.edu.platform.controller;

import com.edu.platform.common.Result;
import com.edu.platform.service.StatsService;
import com.edu.platform.vo.CourseStatsVO;
import com.edu.platform.vo.ScoreDistributionVO;
import com.edu.platform.vo.StatsOverviewVO;
import com.edu.platform.vo.StudentStatsVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 学习统计与报表导出接口
 */
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','TEACHER','HEAD_TEACHER')")
public class StatsController {

    private final StatsService statsService;

    /** 统计总览 */
    @GetMapping("/overview")
    public Result<StatsOverviewVO> overview() {
        return Result.success(statsService.overview());
    }

    /** 课程维度统计 */
    @GetMapping("/course")
    public Result<List<CourseStatsVO>> courseStats() {
        return Result.success(statsService.courseStats());
    }

    /** 指定课程成绩分布（按得分率分桶） */
    @GetMapping("/course/{id}/score-distribution")
    public Result<ScoreDistributionVO> scoreDistribution(@PathVariable("id") Long courseId) {
        return Result.success(statsService.scoreDistribution(courseId));
    }

    /** 学生维度统计 */
    @GetMapping("/student")
    public Result<List<StudentStatsVO>> studentStats() {
        return Result.success(statsService.studentStats());
    }

    /** 导出统计报表（dimension=course|student，format=excel|csv） */
    @GetMapping("/export")
    public ResponseEntity<byte[]> export(@RequestParam("dimension") String dimension,
                                         @RequestParam("format") String format) {
        StatsService.ExportFile file = statsService.export(dimension, format);
        String encodedName = URLEncoder.encode(file.fileName(), StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedName)
                .body(file.content());
    }
}
