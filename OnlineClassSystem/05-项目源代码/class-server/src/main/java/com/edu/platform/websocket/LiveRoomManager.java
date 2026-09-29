package com.edu.platform.websocket;

import com.edu.platform.security.LoginUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * 直播房间会话池：按排课 ID 维护 WebSocket 连接集合
 */
@Slf4j
@Component
public class LiveRoomManager {

    /** 房间（排课ID） -> 连接集合 */
    private final Map<Long, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    public void join(Long scheduleId, WebSocketSession session) {
        rooms.computeIfAbsent(scheduleId, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    public void leave(Long scheduleId, WebSocketSession session) {
        Set<WebSocketSession> sessions = rooms.get(scheduleId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                rooms.remove(scheduleId);
            }
        }
    }

    public int onlineCount(Long scheduleId) {
        Set<WebSocketSession> sessions = rooms.get(scheduleId);
        return sessions == null ? 0 : sessions.size();
    }

    /**
     * 房间在线用户列表（同一用户多标签页/多连接按 userId 去重，保持入房顺序）
     */
    public List<Map<String, Object>> onlineUsers(Long scheduleId) {
        Set<WebSocketSession> sessions = rooms.get(scheduleId);
        if (sessions == null) {
            return List.of();
        }
        Map<Long, Map<String, Object>> dedup = new LinkedHashMap<>();
        for (WebSocketSession session : sessions) {
            LoginUser user = (LoginUser) session.getAttributes().get(LiveHandshakeInterceptor.ATTR_USER);
            if (user != null) {
                dedup.putIfAbsent(user.getUserId(), Map.of(
                        "userId", user.getUserId(),
                        "realName", user.getRealName() == null ? user.getUsername() : user.getRealName(),
                        "roleCode", user.getRoleCode()));
            }
        }
        return new ArrayList<>(dedup.values());
    }

    /**
     * 向房间内所有连接广播文本消息
     */
    public void broadcast(Long scheduleId, String payload) {
        Set<WebSocketSession> sessions = rooms.get(scheduleId);
        if (sessions == null) {
            return;
        }
        for (WebSocketSession session : sessions) {
            sendTo(session, payload);
        }
    }

    /**
     * 发送给单个连接（WebSocketSession 非线程安全，发送时加锁）
     */
    public void sendTo(WebSocketSession session, String payload) {
        if (!session.isOpen()) {
            return;
        }
        try {
            synchronized (session) {
                session.sendMessage(new TextMessage(payload));
            }
        } catch (IOException e) {
            log.warn("WebSocket 消息发送失败：{}", e.getMessage());
        }
    }
}
