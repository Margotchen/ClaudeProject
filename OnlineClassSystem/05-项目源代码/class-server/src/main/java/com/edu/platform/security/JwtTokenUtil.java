package com.edu.platform.security;

import cn.hutool.core.date.DateUtil;
import cn.hutool.jwt.JWT;
import cn.hutool.jwt.JWTUtil;
import cn.hutool.jwt.JWTValidator;
import cn.hutool.jwt.RegisteredPayload;
import com.edu.platform.config.JwtProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT 工具类：生成、解析、校验令牌
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenUtil {

    private final JwtProperties jwtProperties;

    /**
     * 根据用户名生成 token
     */
    public String generateToken(String username) {
        Map<String, Object> payload = new HashMap<>();
        payload.put(RegisteredPayload.SUBJECT, username);
        payload.put("created", new Date());
        payload.put(RegisteredPayload.EXPIRES_AT,
                DateUtil.offsetSecond(new Date(), jwtProperties.getExpiration().intValue()));
        return JWTUtil.createToken(payload, jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 从 token 中解析用户名，解析失败返回 null
     */
    public String getUsernameFromToken(String token) {
        try {
            JWT jwt = JWTUtil.parseToken(token);
            Object subject = jwt.getPayload(RegisteredPayload.SUBJECT);
            return subject == null ? null : subject.toString();
        } catch (Exception e) {
            log.warn("JWT 解析失败：{}", e.getMessage());
            return null;
        }
    }

    /**
     * 校验 token 签名与有效期
     */
    public boolean validateToken(String token) {
        try {
            boolean signOk = JWTUtil.verify(token, jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
            if (!signOk) {
                return false;
            }
            JWTValidator.of(token).validateDate(DateUtil.date());
            return true;
        } catch (Exception e) {
            log.warn("JWT 校验失败：{}", e.getMessage());
            return false;
        }
    }
}
