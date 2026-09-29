package com.edu.platform.vo;

import lombok.Data;

/**
 * 当前登录用户信息
 */
@Data
public class UserInfoVO {

    private Long id;

    private String username;

    private String realName;

    private String roleCode;

    private String roleName;

    private String theme;

    private String avatar;
}
