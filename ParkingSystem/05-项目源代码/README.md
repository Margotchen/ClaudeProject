# 停车位预约管理系统

基于 Vue3 + Node.js + SQLite 的园区停车位预约管理系统。

## 技术栈

- 前端：Vue 3 + Vite + Element Plus + ECharts
- 后端：Node.js + Express + JWT + SQLite
- 数据库：SQLite 3

## 快速启动

### 后端

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

服务运行在 http://localhost:3000

### 前端

```bash
cd client
npm install
npm run dev
```

前端运行在 http://localhost:5173

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | 123456 |
| 车位管理员 | manager | 123456 |
| 普通员工 | employee1 | 123456 |

## 文档

详见项目根目录下的 `01-PRD文档/`、`02-技术方案/`、`03-测试报告/`、`04-AI对话记录/` 目录。

## 跑批测试

```bash
cd server
npm run seed
```

## 测试

```bash
cd server
npm test
```
