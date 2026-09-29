package com.edu.platform.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户列表项（不含密码）
 */
@Data
public class UserVO {

    private Long id;

    private String username;

    private String realName;

    private Long roleId;

    private String roleCode;

    private String roleName;

    private String email;

    private String phone;

    private String avatar;

    private Integer status;

    private String theme;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLoginTime;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
}
