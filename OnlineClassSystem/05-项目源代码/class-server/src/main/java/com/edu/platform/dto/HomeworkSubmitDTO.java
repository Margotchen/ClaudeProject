package com.edu.platform.dto;

import lombok.Data;

/**
 * 学生提交作业请求（附件先经 /api/file/upload 上传）
 */
@Data
public class HomeworkSubmitDTO {

    private Long homeworkId;

    /** 提交内容（文本） */
    private String content;

    /** 附件原始文件名 */
    private String attachmentName;

    /** 附件存储路径 */
    private String attachmentPath;
}
