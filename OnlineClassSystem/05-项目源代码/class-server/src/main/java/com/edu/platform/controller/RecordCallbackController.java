package com.edu.platform.controller;

import cn.hutool.json.JSONObject;
import com.edu.platform.config.RecordProperties;
import com.edu.platform.service.PlaybackVideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

/**
 * SRS 服务器回调（on_dvr 录制完成通知）。
 * 无登录态，通过 URL token 鉴权；SRS 要求响应 {"code":0}。
 */
@Slf4j
@RestController
@RequestMapping("/api/live/record")
@RequiredArgsConstructor
public class RecordCallbackController {

    private final PlaybackVideoService playbackVideoService;
    private final RecordProperties recordProperties;

    @PostMapping("/dvr-callback")
    public Map<String, Integer> dvrCallback(@RequestParam String token, @RequestBody JSONObject body) {
        if (!Objects.equals(recordProperties.getCallbackToken(), token)) {
            log.warn("SRS 回调 token 校验失败");
            return Map.of("code", 403);
        }
        String action = body.getStr("action");
        if (!"on_dvr".equals(action)) {
            return Map.of("code", 0);
        }
        playbackVideoService.onDvrCallback(body.getStr("stream"), body.getStr("file"));
        return Map.of("code", 0);
    }
}
