package com.edu.platform.security;

import cn.hutool.json.JSONUtil;
import com.edu.platform.common.Result;
import com.edu.platform.common.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 无权限访问时返回 403 JSON
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(200);
        response.getWriter().println(JSONUtil.toJsonStr(Result.failed(ResultCode.FORBIDDEN)));
    }
}
