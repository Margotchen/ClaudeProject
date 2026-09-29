-- =============================================================
-- 第四期：课程录播
-- =============================================================
USE online_class;

-- 录播视频表
CREATE TABLE IF NOT EXISTS playback_video (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '录播ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    schedule_id BIGINT NOT NULL COMMENT '排课ID',
    session_id BIGINT COMMENT '直播会话ID',
    title VARCHAR(100) COMMENT '录播标题（默认取直播主题）',
    file_name VARCHAR(255) NOT NULL COMMENT '录制文件名（相对录制根目录）',
    file_size BIGINT COMMENT '文件大小（字节）',
    duration INT COMMENT '时长（秒，取会话时长近似值）',
    status TINYINT DEFAULT 1 COMMENT '状态：1-上架 0-下架',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_course (course_id),
    INDEX idx_schedule (schedule_id),
    UNIQUE KEY uk_file_name (file_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='录播视频表';
