package com.edu.platform.websocket;

import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.edu.platform.common.BizException;
import com.edu.platform.common.MsgType;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.LiveInteractionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;

/**
 * 直播互动 WebSocket 处理器
 * 连接地址：/ws/live/{scheduleId}?token=xxx
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LiveWebSocketHandler extends TextWebSocketHandler {

    private final LiveRoomManager roomManager;
    private final LiveInteractionService interactionService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Long scheduleId = (Long) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_SCHEDULE_ID);
        LoginUser user = (LoginUser) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_USER);
        roomManager.join(scheduleId, session);
        log.info("用户 {} 进入直播间 {}，当前在线 {}", user.getRealName(), scheduleId, roomManager.onlineCount(scheduleId));
        broadcastOnlineCount(scheduleId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Long scheduleId = (Long) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_SCHEDULE_ID);
        LoginUser user = (LoginUser) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_USER);
        try {
            JSONObject json = JSONUtil.parseObj(message.getPayload());
            String type = json.getStr("type");
            String bizId = json.getStr("bizId");
            String content = json.getStr("content");
            String extra = json.getJSONObject("extra") == null ? null : json.getJSONObject("extra").toString();
            if (type == null) {
                throw new BizException("消息类型不能为空");
            }
            // WS 线程无 SecurityContext，手动填充以复用数据权限校验
            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
            try {
                String payload = interactionService.handleMessage(scheduleId, user, type, bizId, content, extra);
                if (payload != null) {
                    roomManager.broadcast(scheduleId, payload);
                }
            } finally {
                SecurityContextHolder.clearContext();
            }
        } catch (BizException e) {
            roomManager.sendTo(session, errorPayload(e.getMessage()));
        } catch (Exception e) {
            log.warn("WebSocket 消息处理失败：{}", e.getMessage());
            roomManager.sendTo(session, errorPayload("消息格式错误"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long scheduleId = (Long) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_SCHEDULE_ID);
        LoginUser user = (LoginUser) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_USER);
        roomManager.leave(scheduleId, session);
        log.info("用户 {} 离开直播间 {}，当前在线 {}",
                user == null ? "?" : user.getRealName(), scheduleId, roomManager.onlineCount(scheduleId));
        broadcastOnlineCount(scheduleId);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WebSocket 传输异常：{}", exception.getMessage());
    }

    /**
     * 广播房间在线人数与在线用户列表（users 按 userId 去重）
     */
    public void broadcastOnlineCount(Long scheduleId) {
        String payload = JSONUtil.createObj()
                .set("type", MsgType.ONLINE)
                .set("data", Map.of(
                        "count", roomManager.onlineCount(scheduleId),
                        "users", roomManager.onlineUsers(scheduleId)))
                .toString();
        roomManager.broadcast(scheduleId, payload);
    }

    private String errorPayload(String message) {
        return JSONUtil.createObj()
                .set("type", MsgType.ERROR)
                .set("data", Map.of("message", message))
                .toString();
    }
}
