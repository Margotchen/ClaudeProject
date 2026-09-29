-- =============================================================
-- 在线课堂直播平台 第二期增量脚本（课程管理 + 直播排课）
-- 前置：已执行 schema.sql
-- =============================================================

USE online_class;

-- -----------------------------
-- 课程表
-- -----------------------------
CREATE TABLE IF NOT EXISTS course (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '课程ID',
    course_name     VARCHAR(100) NOT NULL COMMENT '课程名称',
    description     TEXT COMMENT '课程简介',
    teacher_id      BIGINT NOT NULL COMMENT '讲师用户ID',
    cover_url       VARCHAR(255) COMMENT '课程封面地址',
    syllabus        TEXT COMMENT '课程大纲',
    target_audience VARCHAR(200) COMMENT '适用人群',
    status          TINYINT DEFAULT 1 COMMENT '状态：1-上架 0-下架',
    create_time     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted         TINYINT DEFAULT 0 COMMENT '逻辑删除：0-正常 1-已删',
    KEY idx_teacher_id (teacher_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

-- -----------------------------
-- 直播排课表
-- -----------------------------
CREATE TABLE IF NOT EXISTS live_schedule (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '排课ID',
    course_id   BIGINT NOT NULL COMMENT '课程ID',
    live_title  VARCHAR(100) NOT NULL COMMENT '直播主题',
    start_time  DATETIME NOT NULL COMMENT '计划开播时间',
    duration    INT NOT NULL COMMENT '时长（分钟）',
    status      TINYINT DEFAULT 0 COMMENT '状态：0-未开始 1-直播中 2-已结束',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted     TINYINT DEFAULT 0 COMMENT '逻辑删除：0-正常 1-已删',
    KEY idx_course_id (course_id),
    KEY idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='直播排课表';

-- -----------------------------
-- 示例数据（讲师取 teacher01）
-- -----------------------------
INSERT INTO course (course_name, description, teacher_id, cover_url, syllabus, target_audience, status)
SELECT 'Java 零基础入门', '面向零基础学员的 Java 入门课程，覆盖语法、面向对象、集合与 IO 基础。', u.id,
       '', '第一章 Java 环境搭建\n第二章 基础语法\n第三章 面向对象\n第四章 常用类库', '零基础学员、转行人员', 1
FROM sys_user u WHERE u.username = 'teacher01'
  AND NOT EXISTS (SELECT 1 FROM course WHERE course_name = 'Java 零基础入门');

INSERT INTO course (course_name, description, teacher_id, cover_url, syllabus, target_audience, status)
SELECT '前端 Vue3 实战', 'Vue3 + Vite + Pinia 全家桶实战，从组件开发到项目上线。', u.id,
       '', '第一章 Vue3 基础\n第二章 组合式 API\n第三章 状态管理\n第四章 项目实战', '有 HTML/JS 基础的学员', 1
FROM sys_user u WHERE u.username = 'teacher01'
  AND NOT EXISTS (SELECT 1 FROM course WHERE course_name = '前端 Vue3 实战');

INSERT INTO live_schedule (course_id, live_title, start_time, duration, status)
SELECT c.id, 'Java 环境搭建与第一个程序', DATE_ADD(NOW(), INTERVAL 2 DAY), 90, 0
FROM course c WHERE c.course_name = 'Java 零基础入门'
  AND NOT EXISTS (SELECT 1 FROM live_schedule s WHERE s.course_id = c.id AND s.live_title = 'Java 环境搭建与第一个程序');

INSERT INTO live_schedule (course_id, live_title, start_time, duration, status)
SELECT c.id, 'Vue3 组合式 API 精讲', DATE_ADD(NOW(), INTERVAL 4 DAY), 120, 0
FROM course c WHERE c.course_name = '前端 Vue3 实战'
  AND NOT EXISTS (SELECT 1 FROM live_schedule s WHERE s.course_id = c.id AND s.live_title = 'Vue3 组合式 API 精讲');
