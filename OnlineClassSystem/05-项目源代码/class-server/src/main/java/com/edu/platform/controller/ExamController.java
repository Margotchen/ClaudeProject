package com.edu.platform.controller;

import com.edu.platform.common.PageResult;
import com.edu.platform.common.Result;
import com.edu.platform.dto.ExamGradeDTO;
import com.edu.platform.dto.ExamQueryDTO;
import com.edu.platform.dto.ExamSaveDTO;
import com.edu.platform.dto.ExamSubmitDTO;
import com.edu.platform.service.ExamService;
import com.edu.platform.vo.ExamDetailVO;
import com.edu.platform.vo.ExamRecordVO;
import com.edu.platform.vo.ExamVO;
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

import java.util.List;

/**
 * 考试模块
 */
@RestController
@RequestMapping("/api/exam")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @GetMapping("/page")
    public Result<PageResult<ExamVO>> page(ExamQueryDTO query) {
        return Result.success(PageResult.of(examService.pageExams(query)));
    }

    @GetMapping("/{id}")
    public Result<ExamDetailVO> detail(@PathVariable Long id) {
        return Result.success(examService.getDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> create(@RequestBody ExamSaveDTO dto) {
        examService.createExam(dto);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> update(@PathVariable Long id, @RequestBody ExamSaveDTO dto) {
        dto.setId(id);
        examService.updateExam(dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> delete(@PathVariable Long id) {
        examService.deleteExam(id);
        return Result.success();
    }

    @PostMapping("/{id}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<ExamDetailVO> start(@PathVariable Long id) {
        return Result.success(examService.startExam(id));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<Void> submit(@RequestBody ExamSubmitDTO dto) {
        examService.submitExam(dto);
        return Result.success();
    }

    @GetMapping("/{id}/records")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<PageResult<ExamRecordVO>> records(@PathVariable Long id,
                                                    @RequestParam(defaultValue = "1") Integer pageNum,
                                                    @RequestParam(defaultValue = "10") Integer pageSize) {
        return Result.success(PageResult.of(examService.pageRecords(id, pageNum, pageSize)));
    }

    @GetMapping("/record/{recordId}")
    public Result<ExamRecordVO> recordDetail(@PathVariable Long recordId) {
        return Result.success(examService.getRecordDetail(recordId));
    }

    @GetMapping("/my-records")
    @PreAuthorize("hasRole('STUDENT')")
    public Result<List<ExamRecordVO>> myRecords(@RequestParam Long examId) {
        return Result.success(examService.myRecords(examId));
    }

    @PostMapping("/grade")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> grade(@RequestBody ExamGradeDTO dto) {
        examService.grade(dto);
        return Result.success();
    }
}
