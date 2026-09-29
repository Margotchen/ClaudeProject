package com.edu.platform.vo;

import com.edu.platform.dto.ExamQuestionDTO;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 考试详情/开始答题视图（学生视角题目不含答案）
 */
@Data
public class ExamDetailVO {

    private Long id;

    private Long courseId;

    private String title;

    private Integer duration;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer totalScore;

    /** 题目列表（学生视角已剥离 answer） */
    private List<ExamQuestionDTO> questions;

    /** 开始答题后返回：答卷记录ID */
    private Long recordId;

    /** 开始答题后返回：剩余秒数 */
    private Long remainingSeconds;
}
