package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 考试答卷实体
 */
@Data
@TableName("exam_record")
public class ExamRecord {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 考试ID */
    private Long examId;

    /** 学生ID */
    private Long studentId;

    /** 答案JSON：[{index,answer}] */
    private String answers;

    /** 客观题得分（交卷时自动判分） */
    private Integer objectiveScore;

    /** 主观题得分（讲师批改） */
    private Integer subjectiveScore;

    /** 总分 */
    private Integer totalScore;

    /** 状态：0-答题中 1-待批改 2-已批改 */
    private Integer status;

    /** 批改评语 */
    private String comment;

    /** 开始答题时间 */
    private LocalDateTime startTime;

    /** 交卷时间 */
    private LocalDateTime submitTime;

    /** 批改人ID */
    private Long graderId;

    /** 批改时间 */
    private LocalDateTime gradeTime;

    @TableLogic
    private Integer deleted;
}
