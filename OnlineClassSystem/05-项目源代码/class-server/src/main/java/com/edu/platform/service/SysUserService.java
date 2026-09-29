package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.UserQueryDTO;
import com.edu.platform.dto.UserSaveDTO;
import com.edu.platform.entity.SysUser;
import com.edu.platform.vo.UserVO;

public interface SysUserService extends IService<SysUser> {

    /**
     * 分页查询用户（关联角色名）
     */
    Page<UserVO> pageUsers(UserQueryDTO query);

    /**
     * 新增用户
     */
    void createUser(UserSaveDTO dto);

    /**
     * 编辑用户
     */
    void updateUser(UserSaveDTO dto);

    /**
     * 删除用户（禁止删除自己）
     */
    void deleteUser(Long id);

    /**
     * 启用/禁用用户（禁止操作自己）
     */
    void updateStatus(Long id, Integer status);

    /**
     * 重置密码
     */
    void resetPassword(Long id, String newPassword);

    /**
     * 更新当前用户主题偏好
     */
    void updateTheme(String theme);

    /**
     * 查询全部讲师选项（id + 姓名），供管理员创建课程时选择
     */
    java.util.List<UserVO> listTeachers();
}
