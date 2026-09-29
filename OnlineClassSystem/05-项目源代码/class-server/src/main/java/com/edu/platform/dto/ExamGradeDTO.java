package com.edu.platform.dto;

import lombok.Data;

import java.util.List;

/**
 * 考试批改请求（简答题逐题打分）
 */
@Data
public class ExamGradeDTO {

    /** 答卷记录ID */
    private Long recordId;

    /** 简答题得分列表 */
    private List<EssayScoreDTO> essayScores;

    private String comment;

    @Data
    public static class EssayScoreDTO {

        /** 题目下标（从0开始，须为 ESSAY 题） */
        private Integer index;

        private Integer score;
    }
}
