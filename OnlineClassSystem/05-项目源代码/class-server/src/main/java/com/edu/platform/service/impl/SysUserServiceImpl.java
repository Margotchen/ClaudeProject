package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.UserQueryDTO;
import com.edu.platform.dto.UserSaveDTO;
import com.edu.platform.entity.SysRole;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.SysRoleMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.service.SysUserService;
import com.edu.platform.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser> implements SysUserService {

    private static final String DEFAULT_PASSWORD = "123456";

    private final SysRoleMapper sysRoleMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Page<UserVO> pageUsers(UserQueryDTO query) {
        Page<SysUser> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
                .eq(query.getRoleId() != null, SysUser::getRoleId, query.getRoleId())
                .and(StrUtil.isNotBlank(query.getKeyword()), w -> w
                        .like(SysUser::getUsername, query.getKeyword())
                        .or()
                        .like(SysUser::getRealName, query.getKeyword()))
                .orderByDesc(SysUser::getCreateTime);
        Page<SysUser> userPage = this.page(page, wrapper);

        Map<Long, SysRole> roleMap = sysRoleMapper.selectList(null).stream()
                .collect(Collectors.toMap(SysRole::getId, Function.identity()));

        Page<UserVO> result = new Page<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());
        List<UserVO> records = userPage.getRecords().stream().map(user -> {
            UserVO vo = BeanUtil.copyProperties(user, UserVO.class);
            SysRole role = roleMap.get(user.getRoleId());
            if (role != null) {
                vo.setRoleCode(role.getRoleCode());
                vo.setRoleName(role.getRoleName());
            }
            return vo;
        }).collect(Collectors.toList());
        result.setRecords(records);
        return result;
    }

    @Override
    public void createUser(UserSaveDTO dto) {
        Long count = this.count(new LambdaQueryWrapper<SysUser>().eq(SysUser::getUsername, dto.getUsername()));
        if (count > 0) {
            throw new BizException("用户名已存在");
        }
        checkRoleExists(dto.getRoleId());
        SysUser user = BeanUtil.copyProperties(dto, SysUser.class);
        user.setId(null);
        user.setPassword(passwordEncoder.encode(
                StrUtil.isNotBlank(dto.getPassword()) ? dto.getPassword() : DEFAULT_PASSWORD));
        user.setStatus(1);
        user.setTheme("light");
        this.save(user);
    }

    @Override
    public void updateUser(UserSaveDTO dto) {
        if (dto.getId() == null) {
            throw new BizException("用户ID不能为空");
        }
        SysUser exist = this.getById(dto.getId());
        if (exist == null) {
            throw new BizException("用户不存在");
        }
        checkRoleExists(dto.getRoleId());
        Long count = this.count(new LambdaQueryWrapper<SysUser>()
                .eq(SysUser::getUsername, dto.getUsername())
                .ne(SysUser::getId, dto.getId()));
        if (count > 0) {
            throw new BizException("用户名已存在");
        }
        SysUser user = BeanUtil.copyProperties(dto, SysUser.class);
        // 编辑不允许改密码，走重置密码接口
        user.setPassword(null);
        this.updateById(user);
    }

    @Override
    public void deleteUser(Long id) {
        checkNotSelf(id, "不能删除自己的账号");
        this.removeById(id);
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        checkNotSelf(id, "不能禁用自己的账号");
        SysUser user = new SysUser();
        user.setId(id);
        user.setStatus(status);
        this.updateById(user);
    }

    @Override
    public void resetPassword(Long id, String newPassword) {
        SysUser user = new SysUser();
        user.setId(id);
        user.setPassword(passwordEncoder.encode(newPassword));
        this.updateById(user);
    }

    @Override
    public void updateTheme(String theme) {
        SysUser user = new SysUser();
        user.setId(SecurityUtils.getCurrentUserId());
        user.setTheme(theme);
        this.updateById(user);
    }

    @Override
    public List<UserVO> listTeachers() {
        SysRole teacherRole = sysRoleMapper.selectOne(
                new LambdaQueryWrapper<SysRole>().eq(SysRole::getRoleCode, "TEACHER"));
        if (teacherRole == null) {
            return List.of();
        }
        return this.list(new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getRoleId, teacherRole.getId())
                        .eq(SysUser::getStatus, 1))
                .stream()
                .map(user -> BeanUtil.copyProperties(user, UserVO.class))
                .collect(Collectors.toList());
    }

    private void checkRoleExists(Long roleId) {
        if (sysRoleMapper.selectById(roleId) == null) {
            throw new BizException("角色不存在");
        }
    }

    private void checkNotSelf(Long id, String message) {
        if (SecurityUtils.getCurrentUserId().equals(id)) {
            throw new BizException(message);
        }
    }
}
