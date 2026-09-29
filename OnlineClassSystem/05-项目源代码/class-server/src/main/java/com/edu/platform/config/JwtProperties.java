package com.edu.platform.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 配置属性
 */
@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /** 请求头名称 */
    private String tokenHeader = "Authorization";

    /** 签名密钥 */
    private String secret;

    /** 过期时间（秒） */
    private Long expiration = 86400L;

    /** token 前缀 */
    private String tokenHead = "Bearer ";
}
