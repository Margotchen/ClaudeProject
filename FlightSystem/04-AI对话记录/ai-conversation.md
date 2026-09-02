# AI 对话记录

## 项目

线上机票预订系统（FlightSystem）

## 日期

2026-09-02

## 对话概要

本次对话围绕“线上机票预订系统”的完整实现展开，涵盖 Vue 3 前端、Node.js/Express 后端、SQLite 数据库、角色权限、航班管理、机票查询、在线预订、模拟支付、选座值机、退改签、行程单 PDF、航班动态、通知、统计看板与 Excel/CSV 导出，并按指定目录结构生成 PRD、技术方案、测试报告与 AI 对话记录。

## 主要阶段

### 1. 项目规划
- 明确技术栈：Vue 3 + Vite + Element Plus + Pinia + Vue Router + Axios + ECharts。
- 后端：Node.js + Express + better-sqlite3 + Sequelize + express-session + pdfkit + exceljs + fast-csv。
- 确定归档目录：01-PRD文档 / 02-技术方案 / 03-测试报告 / 04-AI对话记录 / 05-项目源代码。
- 编写 CLAUDE.md 与实施计划。

### 2. 基础框架搭建
- 创建后端 Express 应用、Sequelize 模型、SQLite 兼容封装（sqlite3-wrapper.js）。
- 处理 Node.js 24 下 better-sqlite3 安装问题，升级至 ^13.0.3。
- 修复 sqlite3-wrapper 的参数归一化、占位符替换、$n 转 ? 等问题。
- 创建 session 鉴权与角色校验中间件。
- 初始化数据库脚本与种子数据。

### 3. 模块开发

| 模块 | 主要工作 |
|------|----------|
| 用户认证 | cookie-session 登录、角色路由守卫、前端 Pinia 用户状态 |
| 航班管理 | 航班/排班 CRUD、运营端 FlightManage.vue |
| 机票查询 | 公开搜索接口、乘客端 FlightSearch.vue |
| 在线预订 | 库存扣减事务、订单与乘客创建、Booking.vue |
| 模拟支付 | 支付成功出票、Payment.vue / OrderDetail.vue / MyOrders.vue |
| 选座值机 | 机型座位图生成、选座、24h 值机限制、CheckIn.vue |
| 退改签 | 退票/改签费用计算、客服审核、RefundChange.vue / RefundChangeHandle.vue |
| 行程单 PDF | pdfkit 生成 PDF、Itinerary.vue |
| 航班动态与通知 | 动态列表/更新、站内通知、FlightStatusManage.vue / Layout 通知栏 |
| 统计看板与导出 | ECharts 看板、Excel/CSV 导出、Dashboard.vue |

### 4. 文档与归档
- 编写 PRD 文档、技术架构说明、数据库设计说明书、接口文档、部署手册。
- 编写功能测试报告、性能测试报告、缺陷清单。
- 生成本 AI 对话记录。

## 关键技术问题与解决

1. **better-sqlite3 兼容问题**：Sequelize 默认 sqlite3 在 Node.js 24 下无法安装，通过自定义 `dialectModule` 使用 better-sqlite3，并手写兼容层处理参数绑定与 SQL 占位符。
2. **bulkCreate 不返回主键**：种子数据中对需要 ID 的记录改用 `create` 循环，或在 `bulkCreate` 后 `findAll` 获取 ID。
3. **ESM 下 __dirname**：Vite 配置中改用 `fileURLToPath(new URL('.', import.meta.url))`。
4. **座位图生成**：根据 `aircraft.layout` JSON 按 startRow/rows/cols 生成座位号并判断可用性。
5. **跨域与 cookie**：后端 CORS 启用 `credentials`，前端 Axios 启用 `withCredentials`。

## 交付物

- 源代码：`05-项目源代码/flight-system-backend`、`05-项目源代码/flight-system-frontend`
- 文档：`01-PRD文档`、`02-技术方案`、`03-测试报告`、`04-AI对话记录`
- 最终归档形式：`FlightSystem.zip`

## 备注

开发过程中严格遵守代码与路径使用英文、用户可见文本使用英文的要求；中文仅用于交付文档与目录命名。
