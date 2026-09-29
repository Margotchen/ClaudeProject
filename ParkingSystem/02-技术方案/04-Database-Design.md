# 停车位预约管理系统 - 数据库设计文档

## ER 图说明

核心实体关系：
- 一个用户可拥有多辆车（1:N）
- 一个用户可有多条预约记录（1:N）
- 一个车位可有多条预约记录（1:N）
- 一个区域可包含多个车位（1:N）
- 一条预约对应一条核销记录（1:1）
- 一条预约可对应一条违约记录（1:1）

## 表结构

### departments

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 部门ID |
| name | TEXT UNIQUE | 部门名称 |
| code | TEXT UNIQUE | 部门编码 |
| description | TEXT | 描述 |
| created_at | DATETIME | 创建时间 |

### users

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 用户ID |
| username | TEXT UNIQUE | 用户名 |
| password | TEXT | 密码哈希 |
| real_name | TEXT | 真实姓名 |
| employee_no | TEXT UNIQUE | 工号 |
| department_id | INTEGER FK | 部门ID |
| phone | TEXT | 手机号 |
| role | TEXT | employee / parking_admin / system_admin |
| violation_count | INTEGER | 违约次数 |
| ban_until | DATETIME | 封禁截止时间 |
| status | TEXT | active / disabled |
| created_at | DATETIME | 创建时间 |

### vehicles

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 车辆ID |
| user_id | INTEGER FK | 用户ID |
| plate_number | TEXT UNIQUE | 车牌号 |
| car_type | TEXT | 车型 |
| color | TEXT | 颜色 |
| is_default | INTEGER | 是否默认车辆 |
| created_at | DATETIME | 创建时间 |

### parking_areas

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 区域ID |
| name | TEXT UNIQUE | 区域名称 |
| code | TEXT UNIQUE | 区域编码 |
| floor | INTEGER | 楼层 |
| description | TEXT | 描述 |
| created_at | DATETIME | 创建时间 |

### parking_spots

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 车位ID |
| spot_code | TEXT UNIQUE | 车位编号 |
| area_id | INTEGER FK | 区域ID |
| spot_type | TEXT | fixed / shared / visitor / charging |
| status | TEXT | available / occupied / maintenance |
| owner_id | INTEGER FK | 固定车主ID |
| position_x | INTEGER | 地图X坐标 |
| position_y | INTEGER | 地图Y坐标 |
| qr_code | TEXT | 二维码编码 |
| created_at | DATETIME | 创建时间 |

### system_configs

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | ID |
| config_key | TEXT UNIQUE | 配置键 |
| config_value | TEXT | 配置值 |
| description | TEXT | 说明 |
| updated_at | DATETIME | 更新时间 |

### reservations

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 预约ID |
| reservation_no | TEXT UNIQUE | 预约单号 |
| user_id | INTEGER FK | 用户ID |
| spot_id | INTEGER FK | 车位ID |
| vehicle_id | INTEGER FK | 车辆ID |
| reserve_date | DATE | 预约日期 |
| time_slot | TEXT | morning / afternoon / all_day |
| status | TEXT | reserved / checked_in / cancelled / expired / violation |
| checkin_deadline | DATETIME | 核销截止时间 |
| checkin_time | DATETIME | 核销时间 |
| created_at | DATETIME | 创建时间 |

### checkin_records

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | ID |
| reservation_id | INTEGER FK | 预约ID |
| checkin_method | TEXT | qrcode / plate / manual |
| checkin_by | INTEGER FK | 核销人ID |
| plate_number | TEXT | 车牌号 |
| created_at | DATETIME | 核销时间 |

### violation_records

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | ID |
| user_id | INTEGER FK | 用户ID |
| reservation_id | INTEGER FK | 预约ID |
| reason | TEXT | 违约原因 |
| status | TEXT | active / pardoned |
| pardoned_by | INTEGER FK | 减免人ID |
| pardoned_at | DATETIME | 减免时间 |
| created_at | DATETIME | 创建时间 |

### operation_logs

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | ID |
| user_id | INTEGER FK | 用户ID |
| module | TEXT | 模块 |
| action | TEXT | 动作 |
| detail | TEXT | 详情JSON |
| ip | TEXT | IP地址 |
| created_at | DATETIME | 创建时间 |

### daily_statistics

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | ID |
| stat_date | DATE | 统计日期 |
| area_id | INTEGER FK | 区域ID |
| time_slot | TEXT | 时段 |
| total_spots | INTEGER | 总车位 |
| reserved_count | INTEGER | 预约数 |
| checked_in_count | INTEGER | 核销数 |
| utilization_rate | REAL | 使用率 |
| created_at | DATETIME | 创建时间 |

## 索引设计

```sql
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dept ON users(department_id);
CREATE INDEX idx_users_ban_until ON users(ban_until);
CREATE INDEX idx_spots_area ON parking_spots(area_id);
CREATE INDEX idx_spots_type ON parking_spots(spot_type);
CREATE INDEX idx_reservations_user_date ON reservations(user_id, reserve_date);
CREATE INDEX idx_reservations_spot_date ON reservations(spot_id, reserve_date, time_slot);
CREATE INDEX idx_reservations_expire ON reservations(checkin_deadline, status);
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_violations_user ON violation_records(user_id);
CREATE INDEX idx_checkins_reservation ON checkin_records(reservation_id);
CREATE INDEX idx_logs_module ON operation_logs(module, action);
CREATE INDEX idx_daily_stats_date ON daily_statistics(stat_date);
```

## 初始数据

- 7 个部门
- 4 个停车区域（A/B/C/D）
- 200 个车位（每区 50 个）
- 默认账号：admin、manager、employee1
- 默认系统配置：提前天数、违约阈值、封禁天数、核销宽限
