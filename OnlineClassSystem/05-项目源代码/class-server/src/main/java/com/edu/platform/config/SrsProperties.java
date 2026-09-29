package com.edu.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * SRS 流媒体服务配置（Docker 安装后接入，当前为预留占位）
 */
@Data
@Component
@ConfigurationProperties(prefix = "srs")
public class SrsProperties {

    /** SRS 是否已接入 */
    private boolean enabled = false;

    /** WebRTC 推流（WHIP）地址前缀 */
    private String whipUrl;

    /** WebRTC 拉流（WHEP）地址前缀 */
    private String whepUrl;

    /** HTTP-FLV 拉流地址前缀（备用） */
    private String flvUrl;

    /** 拉流地址后缀 */
    private String flvSuffix;
}
