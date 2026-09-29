package com.edu.platform.controller;

import com.edu.platform.common.Result;
import com.edu.platform.dto.LoginDTO;
import com.edu.platform.service.AuthService;
import com.edu.platform.vo.LoginVO;
import com.edu.platform.vo.UserInfoVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证接口
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO loginDTO) {
        return Result.success(authService.login(loginDTO));
    }

    @GetMapping("/userinfo")
    public Result<UserInfoVO> userinfo() {
        return Result.success(authService.getCurrentUserInfo());
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        // JWT 无状态，登出由前端清除 token
        return Result.success();
    }
}
