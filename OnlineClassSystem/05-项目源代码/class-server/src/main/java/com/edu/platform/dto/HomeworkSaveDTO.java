package com.edu.platform.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 作业新增/编辑请求
 */
@Data
public class HomeworkSaveDTO {

    /** 编辑时传 */
    private Long id;

    private Long courseId;

    private String title;

    private String content;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime deadline;
}
