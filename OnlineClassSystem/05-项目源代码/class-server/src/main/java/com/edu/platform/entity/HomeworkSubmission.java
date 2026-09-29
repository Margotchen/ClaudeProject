package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 作业提交实体
 */
@Data
@TableName("homework_submission")
public class HomeworkSubmission {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 作业ID */
    private Long homeworkId;

    /** 学生ID */
    private Long studentId;

    /** 提交内容（文本） */
    private String content;

    /** 附件原始文件名 */
    private String attachmentName;

    /** 附件存储路径（相对上传根目录） */
    private String attachmentPath;

    /** 提交时间 */
    private LocalDateTime submitTime;

    /** 分数 */
    private Integer score;

    /** 批改评语 */
    private String comment;

    /** 批改人ID */
    private Long graderId;

    /** 批改时间 */
    private LocalDateTime gradeTime;

    /** 状态：0-待批改 1-已批改 */
    private Integer status;

    @TableLogic
    private Integer deleted;
}
