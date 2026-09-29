package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.entity.SysRole;
import com.edu.platform.vo.RoleVO;

import java.util.List;

public interface SysRoleService extends IService<SysRole> {

    /**
     * 查询全部启用角色
     */
    List<RoleVO> listAll();
}
