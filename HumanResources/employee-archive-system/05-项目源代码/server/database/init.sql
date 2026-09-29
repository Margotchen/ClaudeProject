-- 员工主表
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_no VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(64) NOT NULL,
    gender TINYINT DEFAULT 1,
    department VARCHAR(64) NOT NULL,
    position VARCHAR(64),
    id_card VARCHAR(32),
    phone VARCHAR(32),
    email VARCHAR(128),
    entry_date DATE NOT NULL,
    status TINYINT DEFAULT 1,
    emergency_contact VARCHAR(64),
    emergency_phone VARCHAR(32),
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 管理员用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(32) DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 预置管理员账号，密码为 admin123（生产环境务必修改）
INSERT OR IGNORE INTO users (id, username, password_hash, role) VALUES
(1, 'admin', '$2a$10$66UXKg3U1P1Y2aDG8n6Db.sYsPYOlTer.bwcRYJrNnmK3ZYFAa1P2', 'admin');


CREATE INDEX IF NOT EXISTS idx_emp_dept ON employees(department);
CREATE INDEX IF NOT EXISTS idx_emp_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_entry ON employees(entry_date);

-- 合同表
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    contract_type TINYINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    renewal_count INTEGER DEFAULT 0,
    remark TEXT,
    is_current TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_ctr_emp ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_ctr_end ON contracts(end_date);

-- 教育履历
CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    school VARCHAR(128),
    degree VARCHAR(32),
    major VARCHAR(64),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_edu_emp ON education(employee_id);

-- 工作履历
CREATE TABLE IF NOT EXISTS work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    company VARCHAR(128),
    position VARCHAR(64),
    start_date DATE,
    end_date DATE,
    description TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX IF NOT EXISTS idx_work_emp ON work_experience(employee_id);

-- 变动历史
CREATE TABLE IF NOT EXISTS change_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    change_type VARCHAR(32) NOT NULL,
    before_value TEXT,
    after_value TEXT,
    operator VARCHAR(64) DEFAULT '系统管理员',
    operate_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    remark TEXT
);

CREATE INDEX IF NOT EXISTS idx_his_emp ON change_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_his_type ON change_history(change_type);
CREATE INDEX IF NOT EXISTS idx_his_time ON change_history(operate_time);

-- 提醒配置
CREATE TABLE IF NOT EXISTS reminder_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_type VARCHAR(32) NOT NULL,
    days_before INTEGER NOT NULL,
    level VARCHAR(16) DEFAULT 'primary',
    enabled TINYINT DEFAULT 1
);

-- 初始化提醒配置
INSERT OR IGNORE INTO reminder_config (id, reminder_type, days_before, level, enabled) VALUES
(1, 'contract', 30, 'primary', 1),
(2, 'contract', 15, 'warning', 1),
(3, 'contract', 7, 'danger', 1),
(4, 'anniversary', 7, 'primary', 1),
(5, 'birthday', 7, 'primary', 1);
