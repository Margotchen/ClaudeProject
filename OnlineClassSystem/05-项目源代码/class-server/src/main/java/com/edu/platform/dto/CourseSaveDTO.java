package com.edu.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 新增/编辑课程请求
 */
@Data
public class CourseSaveDTO {

    private Long id;

    @NotBlank(message = "课程名称不能为空")
    private String courseName;

    private String description;

    /** 管理员创建时指定讲师；讲师创建时忽略，固定为自己 */
    private Long teacherId;

    private String coverUrl;

    private String syllabus;

    private String targetAudience;
}
