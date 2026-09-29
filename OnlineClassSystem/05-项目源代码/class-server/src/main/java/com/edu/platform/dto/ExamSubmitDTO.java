package com.edu.platform.dto;

import lombok.Data;

import java.util.List;

/**
 * 学生交卷请求
 */
@Data
public class ExamSubmitDTO {

    /** 答卷记录ID（start 接口返回） */
    private Long recordId;

    /** 答案列表 */
    private List<ExamAnswerDTO> answers;

    @Data
    public static class ExamAnswerDTO {

        /** 题目下标（从0开始） */
        private Integer index;

        /** CHOICE 为选项字母，JUDGE 为 "true"/"false"，ESSAY 为文本 */
        private String answer;
    }
}
