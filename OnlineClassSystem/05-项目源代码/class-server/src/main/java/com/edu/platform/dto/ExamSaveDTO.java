package com.edu.platform.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 考试新增/编辑请求
 */
@Data
public class ExamSaveDTO {

    /** 编辑时传 */
    private Long id;

    private Long courseId;

    private String title;

    /** 题目列表 */
    private List<ExamQuestionDTO> questions;

    /** 答题时长（分钟） */
    private Integer duration;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;
}
