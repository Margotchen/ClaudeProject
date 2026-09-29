package com.edu.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 主题偏好更新请求
 */
@Data
public class ThemeUpdateDTO {

    @NotBlank(message = "主题不能为空")
    @Pattern(regexp = "light|dark", message = "主题仅支持 light/dark")
    private String theme;
}
