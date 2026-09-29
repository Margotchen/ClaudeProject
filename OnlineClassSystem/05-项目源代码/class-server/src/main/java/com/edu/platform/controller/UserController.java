package com.edu.platform.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.edu.platform.common.PageResult;
import com.edu.platform.common.Result;
import com.edu.platform.dto.PasswordResetDTO;
import com.edu.platform.dto.ThemeUpdateDTO;
import com.edu.platform.dto.UserQueryDTO;
import com.edu.platform.dto.UserSaveDTO;
import com.edu.platform.service.SysUserService;
import com.edu.platform.vo.UserVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户管理接口
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final SysUserService sysUserService;

    @GetMapping("/page")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<UserVO>> page(UserQueryDTO query) {
        Page<UserVO> page = sysUserService.pageUsers(query);
        return Result.success(PageResult.of(page));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> create(@Valid @RequestBody UserSaveDTO dto) {
        sysUserService.createUser(dto);
        return Result.success();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody UserSaveDTO dto) {
        dto.setId(id);
        sysUserService.updateUser(dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> delete(@PathVariable Long id) {
        sysUserService.deleteUser(id);
        return Result.success();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        sysUserService.updateStatus(id, status);
        return Result.success();
    }

    @PutMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody PasswordResetDTO dto) {
        sysUserService.resetPassword(id, dto.getPassword());
        return Result.success();
    }

    @PutMapping("/theme")
    public Result<Void> updateTheme(@Valid @RequestBody ThemeUpdateDTO dto) {
        sysUserService.updateTheme(dto.getTheme());
        return Result.success();
    }

    @GetMapping("/teachers")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<java.util.List<UserVO>> teachers() {
        return Result.success(sysUserService.listTeachers());
    }
}
