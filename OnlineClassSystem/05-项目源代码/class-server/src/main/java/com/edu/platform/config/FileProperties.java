package com.edu.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 文件上传配置（作业附件等）
 */
@Data
@Component
@ConfigurationProperties(prefix = "file")
public class FileProperties {

    /** 上传文件根目录 */
    private String uploadDir;
}
