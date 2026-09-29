-- =============================================================
-- 第六期：学习进度跟踪
-- =============================================================
USE online_class;

-- 学习进度表（观看时长累计；作业完成率、考试成绩实时聚合不落快照）
CREATE TABLE IF NOT EXISTS study_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    student_id BIGINT NOT NULL COMMENT '学生ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    live_seconds INT DEFAULT 0 COMMENT '直播观看时长（秒）',
    playback_seconds INT DEFAULT 0 COMMENT '录播观看时长（秒）',
    last_study_time DATETIME COMMENT '最近学习时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_student_course (student_id, course_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习进度表';
