package com.edu.platform.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色实体
 */
@Data
@TableName("sys_role")
public class SysRole {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** 角色编码：ADMIN/TEACHER/HEAD_TEACHER/STUDENT */
    private String roleCode;

    private String roleName;

    private String description;

    private Integer sort;

    /** 状态：1-正常 0-停用 */
    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
