# 停车位预约管理系统 - 技术方案文档

## 1. 系统架构

本系统采用前后端分离架构：

```
┌─────────────┐      HTTP/REST       ┌─────────────┐      SQLite      ┌─────────────┐
│   前端      │  <---------------->  │   后端      │  <------------>  │   数据库    │
│ Vue3 + Vite │                     │ Express +   │                     │   parking.db │
│ ElementPlus │                     │ Node.js     │                     │             │
└─────────────┘                     └─────────────┘                     └─────────────┘
                                         │
                                    ┌────┴────┐
                                    │ 定时任务 │
                                    │ node-cron│
                                    └─────────┘
```

## 2. 技术选型

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | Vue 3 | ^3.3.11 | Composition API，响应式系统 |
| 构建工具 | Vite | ^5.0.8 | 快速开发与构建 |
| UI 组件库 | Element Plus | ^2.4.4 | 企业级后台组件 |
| 图表库 | ECharts | ^5.4.3 | 统计图表 |
| 状态管理 | Pinia | ^2.1.7 | 全局状态 |
| 路由 | Vue Router | ^4.2.5 | 前端路由与守卫 |
| 后端框架 | Express | ^4.18.2 | Web 框架 |
| 数据库 | SQLite 3 | ^5.1.6 | 单文件、零配置 |
| 鉴权 | JWT | ^9.0.2 | Token 鉴权 |
| 密码加密 | bcryptjs | ^2.4.3 | 哈希存储 |
| 定时任务 | node-cron | ^3.0.3 | 违约判定、统计 |
| 日期处理 | dayjs | ^1.11.10 | 日期计算 |

## 3. 项目结构

```
停车位预约管理系统/
├── 01-PRD文档/             # 需求与项目基线
│   ├── 01-PRD.md
│   └── 停车位预约管理系统-完整开发方案.md
├── 02-技术方案/             # 技术设计文档
│   ├── 02-Technical-Design.md
│   ├── 03-API-Specification.md
│   ├── 04-Database-Design.md
│   └── 07-Deployment-Guide.md
├── 03-测试报告/             # 测试用例与报告
│   ├── 05-Test-Cases.md
│   └── 06-Test-Report.md
├── 04-AI对话记录/           # AI Coding 上下文
│   └── 08-AI-Coding-Context.md
└── 05-项目源代码/           # 前后端源码
    ├── client/             # 前端项目
    │   ├── src/
    │   │   ├── api/       # 接口封装
    │   │   ├── components/# 公共组件
    │   │   ├── router/    # 路由配置
    │   │   ├── store/     # Pinia 状态
    │   │   └── views/     # 页面
    │   ├── package.json
    │   └── vite.config.js
    ├── server/             # 后端项目
    │   ├── db/            # 数据库连接与初始化
    │   ├── jobs/          # 定时任务
    │   ├── middleware/    # 中间件
    │   ├── routes/        # 路由
    │   ├── services/      # 业务逻辑
    │   ├── tests/         # 测试
    │   └── server.js
    ├── scripts/           # 跑批脚本
    └── README.md
```

## 4. 接口设计

统一响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1723545600000
}
```

HTTP 状态码：
- 200：成功
- 400：业务错误
- 401：未登录或 Token 无效
- 403：权限不足
- 500：服务器内部错误

主要接口模块：
- `POST /api/auth/login` 登录
- `GET /api/auth/profile` 当前用户信息
- `GET /api/users` 用户列表
- `GET /api/vehicles` 我的车辆
- `GET /api/spots` 车位列表
- `GET /api/spots/map-status` 地图状态
- `POST /api/reservations` 创建预约
- `GET /api/reservations/my` 我的预约
- `POST /api/reservations/:id/checkin` 核销
- `POST /api/reservations/checkin-by-plate` 车牌核销
- `GET /api/violations` 违约列表
- `GET /api/stats/overview` 概览统计
- `GET /api/stats/export` CSV 导出
- `GET /api/configs` 系统配置
- `GET /api/logs` 操作日志

## 5. 数据库设计

详见 `04-Database-Design.md`。

核心表：
- `users`：用户与角色
- `vehicles`：员工车辆
- `parking_areas`：停车区域
- `parking_spots`：车位
- `reservations`：预约单
- `checkin_records`：核销记录
- `violation_records`：违约记录
- `system_configs`：系统配置
- `operation_logs`：操作审计

## 6. 核心业务逻辑

### 6.1 预约并发控制

采用数据库事务 + 唯一约束：
1. 开启事务；
2. 查询用户是否有同一时段有效预约；
3. 查询车位是否被同一时段预约；
4. 插入预约记录；
5. 提交事务。

通过事务保证并发场景下同一车位同一时段仅有一条成功预约。

### 6.2 违约判定

`node-cron` 每分钟执行一次：
```sql
SELECT * FROM reservations
WHERE status = 'reserved' AND checkin_deadline < DATETIME('now')
```
对超时预约：
1. 更新状态为 `violation`；
2. 插入 `violation_records`；
3. 用户 `violation_count + 1`；
4. 达到阈值则设置 `ban_until`。

### 6.3 统计预计算

每日 00:30 执行 `dailyStatsJob`，将昨日各区域各时段使用率写入 `daily_statistics` 表，提升查询性能。

## 7. 安全设计

- 密码使用 bcryptjs 加盐哈希存储；
- JWT Token 有效期 7 天；
- 所有写接口鉴权；
- 操作日志记录用户、模块、动作、IP；
- 接口参数服务端校验。

## 8. 部署方案

详见 `07-Deployment-Guide.md`。

## 9. 扩展性

- 通过 `system_configs` 表实现预约规则、违约阈值等配置化；
- 区域、车位、用户、车辆表结构支持后续扩展；
- 统计模块可扩展更多维度（按部门、按车辆类型等）。
