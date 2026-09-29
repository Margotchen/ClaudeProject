package com.edu.platform.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.edu.platform.entity.SysUser;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

public interface SysUserMapper extends BaseMapper<SysUser> {

    /**
     * 查询用户的角色编码
     */
    @Select("SELECT r.role_code FROM sys_user u JOIN sys_role r ON u.role_id = r.id " +
            "WHERE u.id = #{userId} AND u.deleted = 0")
    String selectRoleCodeByUserId(@Param("userId") Long userId);
}
