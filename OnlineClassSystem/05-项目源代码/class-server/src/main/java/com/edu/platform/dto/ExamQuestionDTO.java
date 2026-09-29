package com.edu.platform.dto;

import lombok.Data;

import java.util.List;

/**
 * 考试题目（CHOICE-选择 JUDGE-判断 ESSAY-简答）
 */
@Data
public class ExamQuestionDTO {

    /** 题型：CHOICE/JUDGE/ESSAY */
    private String type;

    /** 题干 */
    private String stem;

    /** 选项（仅 CHOICE） */
    private List<String> options;

    /** 正确答案：CHOICE 为选项序号字母(如"A")，JUDGE 为 "true"/"false"，ESSAY 为空 */
    private String answer;

    /** 分值 */
    private Integer score;
}
