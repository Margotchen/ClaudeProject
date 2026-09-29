package com.edu.platform.controller;

import com.edu.platform.common.Result;
import com.edu.platform.service.SysRoleService;
import com.edu.platform.vo.RoleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 角色接口
 */
@RestController
@RequestMapping("/api/role")
@RequiredArgsConstructor
public class RoleController {

    private final SysRoleService sysRoleService;

    @GetMapping("/list")
    public Result<List<RoleVO>> list() {
        return Result.success(sysRoleService.listAll());
    }
}
