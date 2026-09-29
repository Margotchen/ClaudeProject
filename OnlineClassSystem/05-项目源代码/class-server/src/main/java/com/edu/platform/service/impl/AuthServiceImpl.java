package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edu.platform.common.BizException;
import com.edu.platform.common.ResultCode;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.config.JwtProperties;
import com.edu.platform.dto.LoginDTO;
import com.edu.platform.entity.SysRole;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.SysRoleMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.JwtTokenUtil;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.AuthService;
import com.edu.platform.vo.LoginVO;
import com.edu.platform.vo.UserInfoVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final SysUserMapper sysUserMapper;
    private final SysRoleMapper sysRoleMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenUtil jwtTokenUtil;
    private final JwtProperties jwtProperties;

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        SysUser user = sysUserMapper.selectOne(
                new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, loginDTO.getUsername()));
        if (user == null || !passwordEncoder.matches(loginDTO.getPassword(), user.getPassword())) {
            throw new BizException("用户名或密码错误");
        }
        if (user.getStatus() == null || user.getStatus() != 1) {
            throw new BizException("账号已被禁用，请联系管理员");
        }
        // 更新最后登录时间
        SysUser update = new SysUser();
        update.setId(user.getId());
        update.setLastLoginTime(LocalDateTime.now());
        sysUserMapper.updateById(update);

        String token = jwtTokenUtil.generateToken(user.getUsername());
        return new LoginVO(token, jwtProperties.getTokenHead());
    }

    @Override
    public UserInfoVO getCurrentUserInfo() {
        LoginUser loginUser = SecurityUtils.getCurrentUser();
        SysUser user = sysUserMapper.selectById(loginUser.getUserId());
        if (user == null) {
            throw new BizException(ResultCode.UNAUTHORIZED);
        }
        SysRole role = sysRoleMapper.selectById(user.getRoleId());
        UserInfoVO vo = BeanUtil.copyProperties(user, UserInfoVO.class);
        vo.setRoleCode(role != null ? role.getRoleCode() : null);
        vo.setRoleName(role != null ? role.getRoleName() : null);
        return vo;
    }
}
