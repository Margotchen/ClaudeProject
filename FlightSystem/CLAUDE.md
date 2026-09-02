# FlightSystem — 线上机票预订系统

## 项目概述

为航空公司建设一套前后端分离的线上机票预订系统，覆盖航班管理、机票查询、在线预订、支付、选座值机、退改签、行程单、航班动态、角色权限和统计报表。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 + Vite | Composition API |
| UI 组件库 | Element Plus | 中后台组件 |
| 状态管理 | Pinia | 用户/权限/航班搜索状态 |
| 路由 | Vue Router 4 | 角色路由守卫 |
| 图表 | ECharts / vue-echarts | 统计看板 |
| HTTP 客户端 | Axios | 接口请求，`withCredentials: true` |
| 后端框架 | Node.js + Express | RESTful API |
| 数据库 | SQLite + better-sqlite3 | 单文件数据库 |
| ORM | Sequelize + better-sqlite3 封装 | 兼容 Node 24 |
| 鉴权 | express-session + cookie | 服务端 session，内存存储 |
| PDF 生成 | pdfkit | 电子行程单 |
| 导出 | exceljs + fast-csv | Excel/CSV |
| 定时任务 | node-cron | 航班动态刷新、值机开放检测 |

## 归档目录结构

```
FlightSystem/
├── 01-PRD文档/
│   └── 机票预订系统需求文档.md
├── 02-技术方案/
│   ├── 技术架构说明.md
│   ├── 数据库设计说明书.md
│   ├── 接口文档.md
│   └── 部署手册.md
├── 03-测试报告/
│   ├── 功能测试报告.md
│   ├── 性能测试报告.md
│   └── 缺陷清单.md
├── 04-AI对话记录/
│   └── ai-conversation.md
└── 05-项目源代码/
    ├── flight-system-backend/
    └── flight-system-frontend/
```

## 源代码目录

### 后端（`05-项目源代码/flight-system-backend/`）

```
flight-system-backend/
├── app.js
├── server.js
├── package.json
├── .env.example
├── config/
│   ├── db.config.js
│   └── session.config.js
├── middleware/
│   ├── authSession.js
│   ├── verifyRole.js
│   └── errorHandler.js
├── models/
│   ├── index.js
│   ├── sysRole.model.js
│   ├── sysUser.model.js
│   ├── airport.model.js
│   ├── aircraft.model.js
│   ├── flight.model.js
│   ├── flightSchedule.model.js
│   ├── seatInventory.model.js
│   ├── order.model.js
│   ├── orderPassenger.model.js
│   ├── payment.model.js
│   ├── ticket.model.js
│   ├── seatSelection.model.js
│   ├── refundChange.model.js
│   ├── flightStatus.model.js
│   └── notification.model.js
├── controllers/
│   ├── auth.controller.js
│   ├── flight.controller.js
│   ├── booking.controller.js
│   ├── payment.controller.js
│   ├── checkin.controller.js
│   ├── refundChange.controller.js
│   ├── itinerary.controller.js
│   ├── flightStatus.controller.js
│   ├── statistics.controller.js
│   └── export.controller.js
├── services/
│   ├── flight.service.js
│   ├── booking.service.js
│   ├── payment.service.js
│   ├── checkin.service.js
│   ├── refundChange.service.js
│   ├── flightStatus.service.js
│   └── statistics.service.js
├── routes/
│   ├── index.js
│   ├── auth.routes.js
│   ├── flight.routes.js
│   ├── booking.routes.js
│   ├── payment.routes.js
│   ├── checkin.routes.js
│   ├── refundChange.routes.js
│   ├── itinerary.routes.js
│   ├── flightStatus.routes.js
│   ├── statistics.routes.js
│   └── export.routes.js
├── utils/
│   ├── response.js
│   ├── sqlite3-wrapper.js
│   ├── validators.js
│   └── pdfHelper.js
├── scripts/
│   ├── init-db.js
│   └── seed-data.js
└── data/
    └── .gitkeep
```

### 前端（`05-项目源代码/flight-system-frontend/`）

```
flight-system-frontend/
├── index.html
├── package.json
├── vite.config.js
├── .env.development
├── .env.production
└── src/
    ├── main.js
    ├── App.vue
    ├── api/
    │   ├── auth.js
    │   ├── flight.js
    │   ├── booking.js
    │   ├── payment.js
    │   ├── checkin.js
    │   ├── refundChange.js
    │   ├── itinerary.js
    │   ├── flightStatus.js
    │   ├── statistics.js
    │   └── export.js
    ├── components/
    │   ├── Layout/
    │   │   └── index.vue
    │   ├── NavMenu.vue
    │   └── FlightCard.vue
    ├── router/
    │   └── index.js
    ├── stores/
    │   ├── user.js
    │   └── flightSearch.js
    ├── utils/
    │   ├── request.js
    │   ├── constants.js
    │   └── formatters.js
    └── views/
        ├── login/
        │   └── index.vue
        ├── passenger/
        │   ├── FlightSearch.vue
        │   ├── FlightDetail.vue
        │   ├── Booking.vue
        │   ├── MyOrders.vue
        │   ├── OrderDetail.vue
        │   ├── Payment.vue
        │   ├── CheckIn.vue
        │   ├── SeatMap.vue
        │   └── Itinerary.vue
        ├── service/
        │   ├── RefundChangeHandle.vue
        │   └── PassengerOrders.vue
        └── operator/
            ├── FlightManage.vue
            ├── FlightStatusManage.vue
            └── Dashboard.vue
```

## 开发规范

- 代码、命令、变量名、文件路径使用英文。
- 中文回复仅在面向用户时适用；文档内部按内容语言决定。
- 后端接口统一返回格式：`{ code, message, data }`。
- 前端路由按角色控制访问：`passenger`、`service`、`operator`。
- 数据库模型使用 Sequelize，表名使用下划线、字段使用下划线命名。
- 业务关键操作（下单、退改签）使用事务保证一致性。
- 不使用 JWT，统一使用 cookie-session 鉴权。

## 常用命令

### 后端

```bash
cd 05-项目源代码/flight-system-backend
npm install
npm run db:init
npm run dev
```

### 前端

```bash
cd 05-项目源代码/flight-system-frontend
npm install
npm run dev
npm run build
```

## 注意事项

- 开发环境使用内存 session，生产环境应替换为持久化存储（如 Redis、数据库）。
- `.env` 与数据库文件不提交到版本控制。
- 定时任务仅在主进程启动一次，避免多实例重复执行。
