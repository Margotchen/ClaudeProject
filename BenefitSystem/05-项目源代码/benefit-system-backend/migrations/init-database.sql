-- 企业福利礼品申领管理系统数据库初始化脚本

-- 1. 系统角色表
CREATE TABLE IF NOT EXISTS sys_role (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_code VARCHAR(32) NOT NULL UNIQUE,
  role_name VARCHAR(64) NOT NULL,
  description VARCHAR(255),
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 系统用户表
CREATE TABLE IF NOT EXISTS sys_user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_no VARCHAR(32) NOT NULL UNIQUE,
  username VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(64) NOT NULL,
  department VARCHAR(128),
  phone VARCHAR(32),
  role_id BIGINT NOT NULL,
  status TINYINT DEFAULT 1,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES sys_role(id)
);

-- 3. 礼品信息表
CREATE TABLE IF NOT EXISTS gift_info (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gift_name VARCHAR(128) NOT NULL,
  image_url VARCHAR(255),
  specification VARCHAR(255),
  stock INT DEFAULT 0,
  warn_stock INT DEFAULT 10,
  supplier_name VARCHAR(128),
  supplier_contact VARCHAR(64),
  supplier_phone VARCHAR(32),
  status TINYINT DEFAULT 1,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 福利活动表
CREATE TABLE IF NOT EXISTS welfare_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_name VARCHAR(128) NOT NULL,
  activity_type VARCHAR(32) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  limit_count INT DEFAULT 1,
  description TEXT,
  status TINYINT DEFAULT 0,
  create_by BIGINT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 活动-礼品关联表
CREATE TABLE IF NOT EXISTS activity_gift_rel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id BIGINT NOT NULL,
  gift_id BIGINT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, gift_id)
);

-- 6. 用户收货地址表
CREATE TABLE IF NOT EXISTS user_address (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id BIGINT NOT NULL,
  receiver VARCHAR(64) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  province VARCHAR(64) NOT NULL,
  city VARCHAR(64) NOT NULL,
  district VARCHAR(64) NOT NULL,
  detail_address VARCHAR(255) NOT NULL,
  is_default TINYINT DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- 7. 福利申领主表
CREATE TABLE IF NOT EXISTS welfare_apply (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  total_count INT NOT NULL,
  receiver_snapshot VARCHAR(64) NOT NULL,
  phone_snapshot VARCHAR(32) NOT NULL,
  address_snapshot VARCHAR(512) NOT NULL,
  apply_status TINYINT DEFAULT 1,
  express_company VARCHAR(64),
  express_no VARCHAR(64),
  deliver_time DATETIME,
  sign_time DATETIME,
  feedback TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id),
  FOREIGN KEY (activity_id) REFERENCES welfare_activity(id),
  FOREIGN KEY (user_id) REFERENCES sys_user(id)
);

-- 8. 福利申领明细表
CREATE TABLE IF NOT EXISTS welfare_apply_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  apply_id BIGINT NOT NULL,
  gift_id BIGINT NOT NULL,
  gift_name_snapshot VARCHAR(128) NOT NULL,
  spec_snapshot VARCHAR(255),
  quantity INT NOT NULL,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (apply_id) REFERENCES welfare_apply(id),
  FOREIGN KEY (gift_id) REFERENCES gift_info(id)
);

-- 9. 系统操作日志表
CREATE TABLE IF NOT EXISTS sys_operate_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id BIGINT,
  username VARCHAR(64),
  module VARCHAR(64),
  action VARCHAR(64),
  description TEXT,
  ip VARCHAR(64),
  params TEXT,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_apply_activity_user ON welfare_apply(activity_id, user_id);
CREATE INDEX IF NOT EXISTS idx_apply_item_apply ON welfare_apply_item(apply_id);
CREATE INDEX IF NOT EXISTS idx_apply_item_gift ON welfare_apply_item(apply_id, gift_id);
CREATE INDEX IF NOT EXISTS idx_address_user_default ON user_address(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_gift_status_stock ON gift_info(status, stock);
CREATE INDEX IF NOT EXISTS idx_activity_time_status ON welfare_activity(start_time, end_time, status);

-- 初始化角色数据
INSERT OR IGNORE INTO sys_role (id, role_code, role_name, description) VALUES
(1, 'employee', '普通员工', '福利申领、地址管理、查看物流与签收'),
(2, 'hr', 'HR 管理员', '福利活动、礼品库、申领明细、发货、统计'),
(3, 'admin', '系统管理员', '用户账号、角色权限、系统设置、全量数据');

-- 初始化系统管理员账号：用户名 admin，密码 admin123
INSERT OR IGNORE INTO sys_user (user_no, username, password, real_name, department, role_id, status)
VALUES ('ADMIN001', 'admin', '$2a$10$1t4qlGIR44wLcwyBqnGtJOFdFJi7RczuCIX0LFdp4tGEVpYhohu/y', '系统管理员', 'IT部', 3, 1);

-- 初始化测试 HR 账号：用户名 hr，密码 hr123
INSERT OR IGNORE INTO sys_user (user_no, username, password, real_name, department, role_id, status)
VALUES ('HR001', 'hr', '$2a$10$ZNomQ6TEYh.0gI2SzrSaFONNO8EvMs/m9GJI9lcpLInVe07YmuJAa', 'HR管理员', '人力资源部', 2, 1);

-- 初始化测试员工账号：用户名 employee，密码 emp123
INSERT OR IGNORE INTO sys_user (user_no, username, password, real_name, department, role_id, status)
VALUES ('EMP001', 'employee', '$2a$10$Zu6OuoFjLoPUfNPyhdkW4uV3TjaL/tkaF6FSCYduwoxohgC0jYW5m', '测试员工', '技术部', 1, 1);

-- 初始化示例礼品数据
INSERT OR IGNORE INTO gift_info (id, gift_name, image_url, specification, stock, warn_stock, supplier_name, supplier_contact, supplier_phone, status)
VALUES
(1, '中秋月饼礼盒', 'https://via.placeholder.com/200x200?text=Mooncake', '8枚装，广式+苏式混合', 100, 20, '美味食品有限公司', '张经理', '13800138001', 1),
(2, '坚果大礼包', 'https://via.placeholder.com/200x200?text=Nuts', '1.5kg混合坚果', 150, 30, '坚果世家', '李经理', '13800138002', 1),
(3, '定制保温杯', 'https://via.placeholder.com/200x200?text=Cup', '500ml，304不锈钢', 80, 15, '优品家居', '王经理', '13800138003', 1),
(4, '五谷杂粮礼盒', 'https://via.placeholder.com/200x200?text=Grains', '2kg有机杂粮组合', 120, 25, '绿源农业', '赵经理', '13800138004', 1);
