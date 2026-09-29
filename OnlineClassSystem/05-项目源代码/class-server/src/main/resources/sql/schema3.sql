-- =============================================================
-- 第三期：直播会话 + 互动消息
-- =============================================================
USE online_class;

-- 直播会话表（一次排课对应多次实际开播会话）
CREATE TABLE IF NOT EXISTS live_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
    schedule_id BIGINT NOT NULL COMMENT '排课ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-直播中 2-已结束',
    push_url VARCHAR(255) COMMENT '推流地址（SRS 接入后生效）',
    pull_url VARCHAR(255) COMMENT '拉流地址（SRS 接入后生效）',
    actual_start_time DATETIME COMMENT '实际开播时间',
    end_time DATETIME COMMENT '结束时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_schedule (schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='直播会话表';

-- 互动消息表
CREATE TABLE IF NOT EXISTS live_interaction (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    schedule_id BIGINT NOT NULL COMMENT '直播间（排课）ID',
    user_id BIGINT NOT NULL COMMENT '发送用户ID',
    msg_type VARCHAR(20) NOT NULL COMMENT '类型：DANMAKU弹幕 QUESTION提问 HAND_RAISE举手 VOTE_START发起投票 VOTE_SUBMIT投票提交 VOTE_END结束投票',
    biz_id VARCHAR(64) COMMENT '业务分组ID（投票ID）',
    content VARCHAR(500) COMMENT '消息内容',
    extra TEXT COMMENT 'JSON扩展（投票标题/选项/选项下标等）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_schedule (schedule_id),
    INDEX idx_biz (biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='互动消息表';
