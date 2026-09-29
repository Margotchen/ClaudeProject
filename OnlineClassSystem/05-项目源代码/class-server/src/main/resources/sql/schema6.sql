-- =============================================================
-- 第五期：作业与考试
-- =============================================================
USE online_class;

-- 作业表
CREATE TABLE IF NOT EXISTS homework (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '作业ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    title VARCHAR(100) NOT NULL COMMENT '作业标题',
    content TEXT COMMENT '作业内容/要求',
    deadline DATETIME NOT NULL COMMENT '截止时间',
    creator_id BIGINT NOT NULL COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业表';

-- 作业提交表
CREATE TABLE IF NOT EXISTS homework_submission (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '提交ID',
    homework_id BIGINT NOT NULL COMMENT '作业ID',
    student_id BIGINT NOT NULL COMMENT '学生ID',
    content TEXT COMMENT '提交内容（文本）',
    attachment_name VARCHAR(255) COMMENT '附件原始文件名',
    attachment_path VARCHAR(255) COMMENT '附件存储路径（相对上传根目录）',
    submit_time DATETIME COMMENT '提交时间',
    score INT COMMENT '分数',
    comment VARCHAR(500) COMMENT '批改评语',
    grader_id BIGINT COMMENT '批改人ID',
    grade_time DATETIME COMMENT '批改时间',
    status TINYINT DEFAULT 0 COMMENT '状态：0-待批改 1-已批改',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_hw_student (homework_id, student_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作业提交表';

-- 考试表
CREATE TABLE IF NOT EXISTS exam (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '考试ID',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    title VARCHAR(100) NOT NULL COMMENT '考试标题',
    questions TEXT NOT NULL COMMENT '题目JSON：[{type:CHOICE/JUDGE/ESSAY,stem,options,answer,score}]',
    duration INT NOT NULL COMMENT '答题时长（分钟）',
    start_time DATETIME NOT NULL COMMENT '考试窗口开始时间',
    end_time DATETIME NOT NULL COMMENT '考试窗口截止时间',
    total_score INT NOT NULL COMMENT '总分（各题分值之和）',
    creator_id BIGINT NOT NULL COMMENT '创建人ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试表';

-- 考试答卷表
CREATE TABLE IF NOT EXISTS exam_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '答卷ID',
    exam_id BIGINT NOT NULL COMMENT '考试ID',
    student_id BIGINT NOT NULL COMMENT '学生ID',
    answers TEXT COMMENT '答案JSON：[{index,answer}] 简答answer为文本',
    objective_score INT COMMENT '客观题得分（交卷时自动判分）',
    subjective_score INT COMMENT '主观题得分（讲师批改）',
    total_score INT COMMENT '总分',
    status TINYINT DEFAULT 0 COMMENT '状态：0-答题中 1-待批改 2-已批改',
    comment VARCHAR(500) COMMENT '批改评语',
    start_time DATETIME COMMENT '开始答题时间',
    submit_time DATETIME COMMENT '交卷时间',
    grader_id BIGINT COMMENT '批改人ID',
    grade_time DATETIME COMMENT '批改时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_exam (exam_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='考试答卷表';
