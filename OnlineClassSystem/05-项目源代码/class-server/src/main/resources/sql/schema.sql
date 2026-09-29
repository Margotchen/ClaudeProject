-- =============================================================
-- 在线课堂直播平台 数据库初始化脚本（第一期：地基）
-- 库：online_class    字符集：utf8mb4
-- 初始账号密码由后端 DataInitializer 启动时写入（BCrypt 加密）
-- =============================================================

CREATE DATABASE IF NOT EXISTS online_class DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_general_ci;

USE online_class;

-- -----------------------------
-- 角色表
-- -----------------------------
CREATE TABLE IF NOT EXISTS sys_role (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    role_code   VARCHAR(32) NOT NULL UNIQUE COMMENT '角色编码：ADMIN/TEACHER/HEAD_TEACHER/STUDENT',
    role_name   VARCHAR(32) NOT NULL COMMENT '角色名称',
    description VARCHAR(200) COMMENT '角色描述',
    sort        INT DEFAULT 0 COMMENT '排序',
    status      TINYINT DEFAULT 1 COMMENT '状态：1-正常 0-停用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- -----------------------------
-- 系统用户表
-- -----------------------------
CREATE TABLE IF NOT EXISTS sys_user (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    username        VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
    password        VARCHAR(100) NOT NULL COMMENT 'BCrypt加密密码',
    real_name       VARCHAR(50) NOT NULL COMMENT '真实姓名',
    role_id         BIGINT NOT NULL COMMENT '角色ID（关联sys_role）',
    email           VARCHAR(100) COMMENT '邮箱',
    phone           VARCHAR(20) COMMENT '手机号',
    avatar          VARCHAR(255) COMMENT '头像地址',
    status          TINYINT DEFAULT 1 COMMENT '状态：1-正常 0-禁用',
    theme           VARCHAR(10) DEFAULT 'light' COMMENT '主题偏好：light/dark',
    last_login_time DATETIME COMMENT '最后登录时间',
    create_time     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted         TINYINT DEFAULT 0 COMMENT '逻辑删除：0-正常 1-已删',
    KEY idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';
