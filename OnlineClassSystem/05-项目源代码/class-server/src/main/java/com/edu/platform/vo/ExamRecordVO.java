package com.edu.platform.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 考试答卷记录视图
 */
@Data
public class ExamRecordVO {

    private Long id;

    private Long examId;

    /** 考试标题（学生查自己记录时用） */
    private String examTitle;

    private Long studentId;

    private String studentName;

    private Integer objectiveScore;

    private Integer subjectiveScore;

    private Integer totalScore;

    /** 状态：0-答题中 1-待批改 2-已批改 */
    private Integer status;

    private String comment;

    private LocalDateTime startTime;

    private LocalDateTime submitTime;

    private String graderName;

    private LocalDateTime gradeTime;

    /** 题目列表含正确答案（批改详情时返回） */
    private java.util.List<com.edu.platform.dto.ExamQuestionDTO> questions;

    /** 学生答案（批改详情时返回） */
    private java.util.List<com.edu.platform.dto.ExamSubmitDTO.ExamAnswerDTO> myAnswers;
}
