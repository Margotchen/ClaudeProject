package com.edu.platform.controller;

import com.edu.platform.common.PageResult;
import com.edu.platform.common.Result;
import com.edu.platform.dto.HomeworkGradeDTO;
import com.edu.platform.dto.HomeworkQueryDTO;
import com.edu.platform.dto.HomeworkSaveDTO;
import com.edu.platform.dto.HomeworkSubmitDTO;
import com.edu.platform.service.HomeworkService;
import com.edu.platform.vo.HomeworkSubmissionVO;
import com.edu.platform.vo.HomeworkVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 作业模块
 */
@RestController
@RequestMapping("/api/homework")
@RequiredArgsConstructor
public class HomeworkController {

    private final HomeworkService homeworkService;

    @GetMapping("/page")
    public Result<PageResult<HomeworkVO>> page(HomeworkQueryDTO query) {
        return Result.success(PageResult.of(homeworkService.pageHomework(query)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> create(@RequestBody HomeworkSaveDTO dto) {
        homeworkService.createHomework(dto);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> update(@PathVariable Long id, @RequestBody HomeworkSaveDTO dto) {
        dto.setId(id);
        homeworkService.updateHomework(dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> delete(@PathVariable Long id) {
        homeworkService.deleteHomework(id);
        return Result.success();
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Void> submit(@RequestBody HomeworkSubmitDTO dto) {
        homeworkService.submit(dto);
        return Result.success();
    }

    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<PageResult<HomeworkSubmissionVO>> submissions(@PathVariable Long id,
                                                                @RequestParam(defaultValue = "1") Integer pageNum,
                                                                @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(PageResult.of(homeworkService.pageSubmissions(id, pageNum, pageSize)));
    }

    @GetMapping("/{id}/my")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<HomeworkSubmissionVO> my(@PathVariable Long id) {
        return Result.success(homeworkService.mySubmission(id));
    }

    @PostMapping("/grade")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> grade(@RequestBody HomeworkGradeDTO dto) {
        homeworkService.grade(dto);
        return Result.success();
    }
}
