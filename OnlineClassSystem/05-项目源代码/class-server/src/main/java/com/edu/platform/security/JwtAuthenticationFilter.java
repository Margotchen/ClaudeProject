package com.edu.platform.security;

import cn.hutool.core.util.StrUtil;
import com.edu.platform.config.JwtProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器：每次请求校验 token 并查库确认用户状态（禁用立即生效）
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenUtil jwtTokenUtil;
    private final JwtProperties jwtProperties;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader(jwtProperties.getTokenHeader());
        String token = null;
        if (StrUtil.isNotBlank(authHeader) && authHeader.startsWith(jwtProperties.getTokenHead())) {
            token = authHeader.substring(jwtProperties.getTokenHead().length());
        } else if (StrUtil.isNotBlank(request.getParameter("token"))) {
            // <video> 等无法携带请求头的场景（录播文件流），token 走 query 参数
            token = request.getParameter("token");
        }
        if (StrUtil.isNotBlank(token)) {
            String username = jwtTokenUtil.getUsernameFromToken(token);
            if (StrUtil.isNotBlank(username) && SecurityContextHolder.getContext().getAuthentication() == null
                    && jwtTokenUtil.validateToken(token)) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (userDetails != null && userDetails.isEnabled()) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
