package com.edu.platform.service;

import com.edu.platform.dto.LoginDTO;
import com.edu.platform.vo.LoginVO;
import com.edu.platform.vo.UserInfoVO;

public interface AuthService {

    /**
     * 登录并签发 token
     */
    LoginVO login(LoginDTO loginDTO);

    /**
     * 获取当前登录用户信息
     */
    UserInfoVO getCurrentUserInfo();
}
