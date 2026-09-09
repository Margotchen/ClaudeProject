---
name: tech-architecture
description: 停车位预约管理系统的技术栈、目录结构与运行方式
metadata: 
  node_type: memory
  type: project
  originSessionId: e35a85c1-c39c-4161-9350-314e12991c24
  modified: 2026-08-14T07:40:21.835Z
---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts | `05-项目源代码/client/` 目录，ES Module |
| 后端 | Node.js + Express + JWT + better-sqlite3 | `05-项目源代码/server/` 目录，CommonJS |
| 数据库 | SQLite 3 单文件 | `05-项目源代码/server/parking.db`，零配置 |
| 定时任务 | node-cron | 违约判定、释放车位、每日统计 |
| 日期处理 | dayjs | 前后端均使用 |

## 目录结构

- `05-项目源代码/client/` — 前端源码（`src/api/`、`src/views/`、`src/components/`、`src/store/`、`src/router/`）
- `05-项目源代码/server/` — 后端源码（`routes/`、`services/`、`middleware/`、`jobs/`、`db/`、`tests/`）
- `01-PRD文档/` — PRD、业务规则、项目基线
- `02-技术方案/` — 技术方案、API 文档、数据库设计、部署指南
- `03-测试报告/` — 测试用例、测试报告
- `04-AI对话记录/` — AI Coding 上下文
- `05-项目源代码/scripts/` — 跑批/种子脚本

## 常用命令

```bash
# 后端
cd 05-项目源代码/server && npm install
npm run dev          # nodemon 热启
npm start            # 生产启动
npm run init-db      # 初始化数据库
npm test             # 运行 auth/reservation 测试

# 前端
cd 05-项目源代码/client && npm install
npm run dev          # vite dev server
npm run build        # 生产构建
npm run test         # vitest
```

**Why:** 技术栈在 AI Coding 早期已经确定，轻量、易于演示部署；SQLite 单文件和前后端分离是后续扩展的约束边界。

**How to apply:**
- 不要替换核心数据库为 PostgreSQL/MySQL，除非用户明确要求。
- 前端保持 Vue 3 Composition API + Element Plus，不要引入新的 UI 框架。
- 后端接口统一响应格式（`{ code, message, data, timestamp }`），参考 `02-技术方案/03-API-Specification.md`。
