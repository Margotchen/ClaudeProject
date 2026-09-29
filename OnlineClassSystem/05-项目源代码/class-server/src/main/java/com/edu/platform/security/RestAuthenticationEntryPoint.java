package com.edu.platform.security;

import cn.hutool.json.JSONUtil;
import com.edu.platform.common.Result;
import com.edu.platform.common.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * 未认证访问时返回 401 JSON
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(200);
        response.getWriter().println(JSONUtil.toJsonStr(Result.failed(ResultCode.UNAUTHORIZED)));
    }
}
