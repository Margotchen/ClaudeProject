package com.edu.platform.websocket;

import com.edu.platform.common.BizException;
import com.edu.platform.security.JwtTokenUtil;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.LiveScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

/**
 * WebSocket 握手拦截器：校验 query 中的 JWT token，解析直播间 ID
 * （浏览器 WebSocket 无法携带请求头，token 走 query 参数）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LiveHandshakeInterceptor implements HandshakeInterceptor {

    public static final String ATTR_USER = "loginUser";
    public static final String ATTR_SCHEDULE_ID = "scheduleId";

    private final JwtTokenUtil jwtTokenUtil;
    private final UserDetailsService userDetailsService;
    private final LiveScheduleService liveScheduleService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        URI uri = request.getURI();
        // 路径格式：/ws/live/{scheduleId}
        String[] segments = uri.getPath().split("/");
        if (segments.length < 4) {
            log.warn("WebSocket 握手失败：路径非法 {}", uri.getPath());
            return false;
        }
        Long scheduleId;
        try {
            scheduleId = Long.valueOf(segments[3]);
        } catch (NumberFormatException e) {
            log.warn("WebSocket 握手失败：排课ID非法 {}", uri.getPath());
            return false;
        }
        String token = parseQueryParam(uri.getQuery(), "token");
        if (token == null || !jwtTokenUtil.validateToken(token)) {
            log.warn("WebSocket 握手失败：token 无效");
            return false;
        }
        String username = jwtTokenUtil.getUsernameFromToken(token);
        try {
            LoginUser loginUser = (LoginUser) userDetailsService.loadUserByUsername(username);
            if (!loginUser.isEnabled()) {
                log.warn("WebSocket 握手失败：用户已禁用 {}", username);
                return false;
            }
            // 房间级数据权限：讲师仅自己课程、学生仅上架课程，越权拒绝握手
            liveScheduleService.checkRoomAccessible(scheduleId, loginUser);
            attributes.put(ATTR_USER, loginUser);
            attributes.put(ATTR_SCHEDULE_ID, scheduleId);
            return true;
        } catch (BizException e) {
            log.warn("WebSocket 握手失败：{}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.warn("WebSocket 握手失败：{}", e.getMessage());
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }

    private String parseQueryParam(String query, String name) {
        if (query == null) {
            return null;
        }
        for (String pair : query.split("&")) {
            int idx = pair.indexOf('=');
            if (idx > 0 && pair.substring(0, idx).equals(name)) {
                return pair.substring(idx + 1);
            }
        }
        return null;
    }
}
