package com.edu.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 课程录播配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "record")
public class RecordProperties {

    /** 录制文件根目录（SRS 容器内 /data/dvr 挂载的宿主机目录） */
    private String dir;

    /** SRS on_dvr 回调鉴权 token */
    private String callbackToken;
}
