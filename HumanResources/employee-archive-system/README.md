# 员工信息档案管理系统

基于 Vue3 + Node.js + SQLite 全栈技术栈的一体化员工档案管理系统。

## 交付物清单

```
employee-archive-system/
├── 01-PRD/产品需求文档.md          # 产品需求文档
├── 02-技术方案/技术方案文档.md      # 系统架构、数据库与接口设计
├── 03-测试报告/测试用例.md          # 功能与跑批测试用例
├── 03-测试报告/测试报告.md          # 测试结果与结论
├── 04-源代码/                       # 完整项目源代码
│   ├── server/                      # Node.js + Express 后端
│   └── web/                         # Vue3 + Vite 前端
└── 05-AI对话记录/AI编码对话记录.md  # AI 交互记录
```

## 快速启动

### 环境要求

- Node.js ≥ 22.5.0（本项目使用 Node 内置 `node:sqlite` 操作 SQLite，无需额外编译 sqlite3）
- npm

### 后端

```bash
cd 04-源代码/server
npm install
npm run init-db      # 初始化数据库
npm run seed         # 导入 120 条示例数据
npm run dev          # 启动服务 http://localhost:3001
```

### 前端

```bash
cd 04-源代码/web
npm install
npm run dev          # 启动服务 http://localhost:5173
```

浏览器访问 `http://localhost:5173` 即可使用系统。

## 核心功能

- 用户认证：JWT 登录 / 退出，密码使用 bcryptjs 加密。
- 员工档案：增删改查、批量导入、搜索筛选排序分页、数据脱敏。
- 合同管理：新增、更新、续签，自动纳入到期提醒池。
- 提醒中心：合同到期多级预警（≤7 天 / ≤15 天 / ≤30 天）、入职周年、生日提醒。
- 花名册导出：Excel / PDF，自定义字段，自动文件名。
- 组织架构：部门人数柱状图、岗位分布饼图、司龄分布、部门下钻。
- 变动历史：入职、转岗、离职、续签等全生命周期记录。

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

登录后所有业务接口将校验 JWT Token。

## 注意事项

- PDF 导出使用 pdfmake，中文显示需将中文字体（如 SimHei.ttf）放置于 `04-源代码/server/fonts/` 目录。
- 生产环境建议迁移至 MySQL / PostgreSQL 并定期备份数据库。
