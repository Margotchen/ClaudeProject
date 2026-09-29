# 停车位预约管理系统 - 部署指南

## 1. 环境要求

- Node.js 18+
- npm 9+
- 现代浏览器（Chrome/Firefox/Edge）

## 2. 后端部署

### 2.1 安装依赖

```bash
cd 05-项目源代码/server
cp .env.example .env
npm install
```

### 2.2 配置环境变量

编辑 `.env`：

```env
PORT=3000
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=123456
```

### 2.3 初始化数据库

```bash
npm run init-db
```

### 2.4 启动服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm start
```

服务运行在 http://localhost:3000

## 3. 前端部署

### 3.1 安装依赖

```bash
cd 05-项目源代码/client
npm install
```

### 3.2 开发模式

```bash
npm run dev
```

前端运行在 http://localhost:5173

### 3.3 生产构建

```bash
npm run build
```

构建产物在 `05-项目源代码/client/dist/` 目录。

## 4. 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 系统管理员 | admin | 123456 |
| 车位管理员 | manager | 123456 |
| 普通员工 | employee1 | 123456 |

## 5. 跑批测试

```bash
cd 05-项目源代码/server
npm run seed
```

## 6. 运行测试

```bash
cd 05-项目源代码/server
npm test
```

## 7. 常见问题

### 7.1 端口被占用

修改 `.env` 中的 `PORT` 或 `vite.config.js` 中的 `server.port`。

### 7.2 SQLite 数据库文件过大

可定期清理 `operation_logs` 和过期 `reservations` 数据。

### 7.3 前端请求 401

检查 localStorage 中 token 是否过期，重新登录。

## 8. 生产部署建议

- 使用 PM2 管理 Node 进程；
- 使用 Nginx 反向代理并部署前端静态资源；
- 定期备份 `05-项目源代码/server/parking.db`；
- 修改默认管理员密码。
