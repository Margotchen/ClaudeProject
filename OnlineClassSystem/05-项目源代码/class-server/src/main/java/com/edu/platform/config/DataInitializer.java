package com.edu.platform.config;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edu.platform.entity.SysRole;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.SysRoleMapper;
import com.edu.platform.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 初始数据写入：启动时若角色/用户表为空则插入基础数据
 * 初始密码均为 123456（BCrypt 加密），仅限开发环境
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SysRoleMapper sysRoleMapper;
    private final SysUserMapper sysUserMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (sysRoleMapper.selectCount(null) > 0) {
            return;
        }
        log.info("初始化角色与测试账号数据...");

        insertRole("ADMIN", "管理员", "平台全局管理", 1);
        insertRole("TEACHER", "讲师", "课程与直播教学", 2);
        insertRole("HEAD_TEACHER", "班主任", "班级学员监督", 3);
        insertRole("STUDENT", "学生", "在线学习", 4);

        insertUser("admin", "系统管理员", "ADMIN");
        insertUser("teacher01", "张老师", "TEACHER");
        insertUser("headteacher01", "李班主任", "HEAD_TEACHER");
        insertUser("student01", "王同学", "STUDENT");

        log.info("初始数据写入完成，账号：admin/teacher01/headteacher01/student01，密码：123456");
    }

    private void insertRole(String code, String name, String description, int sort) {
        SysRole role = new SysRole();
        role.setRoleCode(code);
        role.setRoleName(name);
        role.setDescription(description);
        role.setSort(sort);
        role.setStatus(1);
        sysRoleMapper.insert(role);
    }

    private void insertUser(String username, String realName, String roleCode) {
        SysRole role = sysRoleMapper.selectOne(
                new LambdaQueryWrapper<SysRole>().eq(SysRole::getRoleCode, roleCode));
        SysUser user = new SysUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode("123456"));
        user.setRealName(realName);
        user.setRoleId(role.getId());
        user.setStatus(1);
        user.setTheme("light");
        sysUserMapper.insert(user);
    }
}
