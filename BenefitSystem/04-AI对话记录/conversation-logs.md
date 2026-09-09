# AI 对话记录

## 项目背景

基于 `c:\ClaudeProject\BenefitSystem\claude.md` 需求文档，规划并开发一套企业福利礼品申领管理系统，实现活动管理、礼品库、员工申领、地址管理、发货签收、统计看板、RBAC、批量导出等功能，并按 5 大目录结构交付。

## 关键决策

1. **技术栈选型**
   - 前端：Vue 3 + Vite + Element Plus + ECharts
   - 后端：Node.js + Express + Sequelize ORM
   - 数据库：SQLite（通过 better-sqlite3 驱动）
   - 鉴权：JWT + bcryptjs

2. **数据库初始化**
   - 使用 `migrations/init-database.sql` 初始化表结构与默认数据。
   - 开发阶段使用 `db.sequelize.sync()` 自动建表。

3. **库存并发控制**
   - 采用 Sequelize 事务 + 条件更新（`WHERE stock >= ?`）防止超卖。
   - 修改申领时先回退旧库存，再扣减新库存。

4. **活动生命周期**
   - 状态字段 + `node-cron` 定时刷新 + 接口实时时间校验。

5. **地址快照**
   - 申领主表冗余保存地址字符串，保证历史数据稳定。

## 主要实施阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| S0 | 创建目录结构并初始化前后端工程 | 完成 |
| S1 | 完成 Sequelize 模型、关联与数据库初始化脚本 | 完成 |
| S2 | 实现 JWT 认证、角色校验与统一响应 | 完成 |
| S3 | 实现用户管理、角色管理与密码重置接口 | 完成 |
| S4 | 实现礼品库 CRUD、上下架与库存调整 | 完成 |
| S5 | 实现福利活动 CRUD、启停与礼品配置 | 完成 |
| S6 | 实现员工收货地址 CRUD 与默认地址 | 完成 |
| S7 | 实现申领提交、修改与库存事务逻辑 | 完成 |
| S8 | 实现单条/批量发货与签收反馈 | 完成 |
| S9 | 实现统计看板与 Excel/CSV 导出 | 完成 |
| S10 | 搭建前端基础（路由、布局、登录、请求封装） | 完成 |
| S11 | 实现前端业务页面（员工/HR/Admin） | 完成 |
| S12 | 解决 SQLite 运行时兼容性并验证系统可运行 | 完成 |
| S13 | 编写技术方案文档与测试报告 | 完成 |

## 运行时兼容性调试

### 问题 1：sqlite3 无法安装
- **现象**：`npm install sqlite3` 在 Node 24 下缺少预编译二进制，且无法本地编译。
- **解决**：切换为 `better-sqlite3`。

### 问题 2：node-sqlite3-wasm 运行崩溃
- **现象**：运行时抛出异常。
- **解决**：放弃该包，统一使用 `better-sqlite3`。

### 问题 3：Sequelize 与 better-sqlite3 API 不兼容
- **现象**：Sequelize sqlite 方言期望 `sqlite3` 风格的异步 API，但 `better-sqlite3` 为同步 API。
- **解决**：编写 `utils/sqlite3-wrapper.js`，暴露 sqlite3 风格的 `Database` 类，内部调用 `better-sqlite3`。

### 问题 4：$N 占位符不支持
- **现象**：Sequelize 生成 `UPDATE ... SET status=$1 WHERE status=$3`，better-sqlite3 解析失败。
- **解决**：在 `_prepare` 中将 `$N` 转换为 `?`，并按对象中的 `$1, $2, ...` 键排序生成参数数组。

### 问题 5：结果对象缺少 lastID/changes
- **现象**：Sequelize 读取 `metaData.changes` 为 undefined。
- **解决**：将 better-sqlite3 结果 `{ lastInsertRowid, changes }` 映射为 `{ lastID, changes }`，并通过 `callback.call(context, ...)` 传递正确的 `this` 上下文。

### 问题 6：默认账号密码哈希错误
- **现象**：登录返回“用户名或密码错误”。
- **解决**：使用 bcryptjs 重新生成 admin/hr/employee 的密码哈希，并更新数据库。

## 验证结果

- 后端服务成功启动并监听 3000 端口。
- 默认账号（admin/hr/employee）均可正常登录。
- 通过 `scripts/api-smoke-test.js` 完成端到端流程验证：
  - 创建活动 → 配置礼品 → 员工申领 → 库存扣减 → HR 发货 → 员工签收 → 统计看板
- 前端 `npm run build` 构建成功。

## 交付物

```
c:\ClaudeProject\BenefitSystem
├── 01-PRD文档
│   └── 企业福利礼品申领管理系统需求文档.md
├── 02-技术方案
│   ├── 技术架构说明.md
│   ├── 数据库设计说明书.md
│   ├── 接口文档.md
│   └── 部署手册.md
├── 03-测试报告
│   ├── 功能测试报告.md
│   ├── 性能测试报告.md
│   └── 缺陷清单.md
├── 04-AI对话记录
│   └── conversation-logs.md
└── 05-项目源代码
    ├── benefit-system-backend/
    └── benefit-system-frontend/
```

## 后续建议

1. 补充浏览器端导出下载验证。
2. 增加前端 Vitest 单元测试与 Playwright E2E 测试。
3. 根据实际并发需求评估是否迁移至 MySQL/PostgreSQL。
4. 生产环境部署前务必修改默认账号密码与 JWT Secret。
