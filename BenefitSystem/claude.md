# 企业福利礼品申领管理系统 开发需求文档（claude.md）

> 本文档为全栈项目开发指导规范，面向 AI 开发助手，完整覆盖业务需求、技术架构、数据库设计、接口规范与验收标准，可直接用于项目落地开发。

------

## 01 项目概述

### 1.1 项目背景

当前企业节假日福利礼品发放依赖 Excel 表格收集员工选择与收货地址，存在数据汇总效率低、库存与发货进度难跟踪、员工体验差、数据易出错等痛点，需开发一套线上化的福利礼品申领管理系统，实现从活动创建到签收反馈的全流程数字化闭环。

### 1.2 建设目标

1. 实现福利活动创建、礼品库管理、员工在线申领的全流程线上化
2. 支持发货状态跟踪、签收确认与问题反馈，闭环管理发放全流程
3. 提供多维度数据统计与批量导出能力，大幅提升 HR 工作效率
4. 基于角色的权限控制体系，保障数据安全与操作范围隔离

### 1.3 系统角色定义

表格







|    角色    |                         核心权限范围                         |
| :--------: | :----------------------------------------------------------: |
|  普通员工  |  福利申领、个人地址管理、查看我的申领与物流、签收确认与反馈  |
| HR 管理员  | 福利活动管理、礼品库管理、申领明细查看与导出、发货状态更新、统计报表查看 |
| 系统管理员 |   用户账号管理、角色权限配置、系统设置、全量数据查看与管理   |

------

## 02 业务功能详细需求

### 2.1 福利活动管理（HR / 管理员权限）

#### 核心操作

- 活动创建

  ：HR 可新建福利活动，必填配置项包括：

  - 基础信息：活动名称、活动类型（春节 / 中秋 / 生日 / 其他）、活动开始时间、活动结束时间
  - 申领规则：每人限选礼品总数量、活动说明公告
  - 礼品配置：从礼品库中勾选本次活动支持申领的礼品

- **活动管理**：支持活动列表分页查询、编辑、启用 / 停用、删除操作

- **活动详情**：查看活动基础信息、可选礼品清单、申领统计数据、全部申领记录列表

#### 业务规则

- 活动时间到期后自动关闭，员工无法再提交或修改申领
- 进行中的活动不可删除，仅可停用；未开始的活动可删除
- 修改活动配置时，已产生的历史申领记录不受影响

### 2.2 礼品库管理（HR / 管理员权限）

#### 核心操作

- 礼品全生命周期维护：支持新增、编辑、删除、上下架操作
- 礼品信息字段：礼品名称、主图 URL、规格描述、库存数量、库存预警阈值、供应商名称、供应商联系人、供应商联系电话、礼品状态
- 库存手动调整：支持直接修改库存数量，自动记录库存变更日志

#### 业务规则

- 已关联进行中活动的礼品不可直接删除，仅可下架
- 礼品库存为 0 时，员工端置灰不可选择
- 库存低于预警阈值时，HR 端列表高亮提醒

### 2.3 员工在线申领

#### 核心操作

- 活动大厅：员工登录后首页展示所有进行中的福利活动，点击进入活动详情页
- 礼品选择：活动页展示可选礼品的图片、名称、规格、剩余库存，员工勾选礼品并选择申领数量
- 地址选择：申领时可选择已保存的收货地址，或临时新增收货地址
- 申领提交：确认礼品与地址信息后提交申领单
- 申领修改：活动截止前，员工可修改已提交的申领单（更换礼品、调整数量、修改地址）

#### 业务规则

- 每人每个活动仅可保留 1 条有效申领单，重新提交后覆盖原有记录
- 申领礼品总数量不可超过活动设置的每人限选数量
- 提交申领时实时扣减对应礼品库存；修改申领时同步调整库存（先回退原礼品库存，再扣减新礼品库存）
- 活动结束后不可修改任何申领信息

### 2.4 收货地址管理（员工权限）

- 地址列表：员工可查看自己维护的所有收货地址
- 地址操作：支持新增、编辑、删除地址
- 默认地址：可设置单条地址为默认地址，申领时自动选中默认地址

> 业务规则：同一用户仅可设置 1 个默认地址，设置新默认地址时自动取消原默认地址；删除地址不影响已提交的申领单（申领单保存地址快照）。

### 2.5 批量导出（HR / 管理员权限）

- 支持按单个活动导出全部申领明细，也支持选中部分记录导出
- 导出字段：活动名称、员工工号、员工姓名、所属部门、礼品名称、礼品规格、申领数量、收货人、联系电话、完整收货地址、申领时间、发货状态、物流公司、快递单号、签收状态
- 导出格式：支持 `.xlsx`、`.csv` 两种格式

### 2.6 发货状态跟踪

#### HR 端能力

- 申领列表支持按发货状态筛选（待发货 / 已发货 / 已签收）
- 支持单个 / 批量更新发货状态，录入物流公司、快递单号、发货备注
- 支持修改已录入的物流信息

#### 员工端能力

- 在「我的申领」列表中查看每条申领的实时发货状态
- 查看物流详情页，展示物流公司、快递单号、发货时间

### 2.7 签收确认与问题反馈

- 员工收到礼品后，可在线点击「确认签收」
- 签收时可选择性填写问题反馈（如礼品破损、错发漏发等）
- HR 端可查看所有带反馈的申领单，标记处理状态
- 签收后申领单状态变更为「已签收」，不可再修改

### 2.8 统计报表（HR / 管理员权限）

#### 数据看板

- 核心指标卡片：活动总数、进行中活动数、累计申领人次、待发货数量
- 礼品申领排行：按申领数量排序的 Top10 礼品柱状图
- 部门参与率：各部门申领参与率饼图 / 柱状图
- 发货进度统计：各活动的待发货 / 已发货 / 已签收数量统计

#### 导出能力

所有统计报表均支持导出为 Excel 格式。

### 2.9 用户与权限管理（系统管理员权限）

- 用户管理：新增、编辑、删除系统用户，设置用户角色、部门、工号等基础信息
- 角色管理：配置角色对应的菜单与接口权限，控制不同角色的访问范围
- 密码重置：管理员可重置用户登录密码

------

## 03 技术架构方案

### 3.1 整体架构

采用**前后端分离**架构，前端负责页面渲染与交互逻辑，后端提供 RESTful API 接口，关系型数据库持久化存储数据；前后端通过 HTTP 协议交互，使用 JWT 实现无状态身份鉴权。

### 3.2 技术选型

表格







|   层级   |                技术栈                 |                             说明                             |
| :------: | :-----------------------------------: | :----------------------------------------------------------: |
|   前端   | Vue 3 + Vite + Element Plus + ECharts | Vue3 组合式 API 开发，Element Plus 组件库，ECharts 实现数据图表 |
|   后端   |   Node.js + Express + Sequelize ORM   |         轻量高效，快速迭代，Sequelize 负责数据库操作         |
|  数据库  |                SQLite                 |                关系型数据库，存储全量业务数据                |
| 鉴权方案 |         JWT（JSON Web Token）         |           无状态鉴权，接口请求携带 Token 验证身份            |
| 接口规范 |              RESTful API              |                    统一接口风格与响应格式                    |

### 3.3 安全规范

- 登录成功后签发 JWT Token，前端存储于 localStorage，请求时携带在`Authorization`请求头
- Token 设置过期时间，过期后自动跳转登录页
- 后端所有接口按角色做权限校验，越权访问返回 403 状态码
- 用户密码使用 bcrypt 加密存储，禁止明文落库
- 全局接口参数校验，防御 SQL 注入、XSS 攻击

------

## 04 数据库设计

### 4.1 数据表总览

表格







|        表名        |      表说明       |
| :----------------: | :---------------: |
|      sys_user      |    系统用户表     |
|      sys_role      |    系统角色表     |
|     gift_info      |    礼品信息表     |
|  welfare_activity  |    福利活动表     |
| activity_gift_rel  | 活动 - 礼品关联表 |
|    user_address    |  员工收货地址表   |
|   welfare_apply    |   福利申领主表    |
| welfare_apply_item |  福利申领明细表   |
|  sys_operate_log   |  系统操作日志表   |

### 4.2 详细表结构

#### 1. sys_user 系统用户表

表格







|   字段名    |     类型     |        说明         |                         约束                          |
| :---------: | :----------: | :-----------------: | :---------------------------------------------------: |
|     id      |    BIGINT    |       主键 ID       |              PRIMARY KEY, AUTO_INCREMENT              |
|   user_no   | VARCHAR(32)  |      员工工号       |                   UNIQUE, NOT NULL                    |
|  username   | VARCHAR(64)  |      登录账号       |                   UNIQUE, NOT NULL                    |
|  password   | VARCHAR(255) |      密码哈希       |                       NOT NULL                        |
|  real_name  | VARCHAR(64)  |      真实姓名       |                       NOT NULL                        |
| department  | VARCHAR(128) |      所属部门       |                                                       |
|    phone    | VARCHAR(32)  |       手机号        |                                                       |
|   role_id   |    BIGINT    |       角色 ID       |                      FOREIGN KEY                      |
|   status    |   TINYINT    | 状态：1 启用 0 禁用 |                       DEFAULT 1                       |
| create_time |   DATETIME   |      创建时间       |               DEFAULT CURRENT_TIMESTAMP               |
| update_time |   DATETIME   |      更新时间       | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 2. sys_role 系统角色表

表格







|   字段名    |     类型     |            说明             |            约束             |
| :---------: | :----------: | :-------------------------: | :-------------------------: |
|     id      |    BIGINT    |           主键 ID           | PRIMARY KEY, AUTO_INCREMENT |
|  role_code  | VARCHAR(32)  | 角色标识：employee/hr/admin |      UNIQUE, NOT NULL       |
|  role_name  | VARCHAR(64)  |          角色名称           |          NOT NULL           |
| description | VARCHAR(255) |          角色描述           |                             |
| create_time |   DATETIME   |          创建时间           |  DEFAULT CURRENT_TIMESTAMP  |

#### 3. gift_info 礼品信息表

表格







|      字段名      |     类型     |        说明         |                         约束                          |
| :--------------: | :----------: | :-----------------: | :---------------------------------------------------: |
|        id        |    BIGINT    |       主键 ID       |              PRIMARY KEY, AUTO_INCREMENT              |
|    gift_name     | VARCHAR(128) |      礼品名称       |                       NOT NULL                        |
|    image_url     | VARCHAR(255) |    礼品主图 URL     |                                                       |
|  specification   | VARCHAR(255) |      规格描述       |                                                       |
|      stock       |     INT      |      库存数量       |                       DEFAULT 0                       |
|    warn_stock    |     INT      |    库存预警阈值     |                      DEFAULT 10                       |
|  supplier_name   | VARCHAR(128) |     供应商名称      |                                                       |
| supplier_contact | VARCHAR(64)  |    供应商联系人     |                                                       |
|  supplier_phone  | VARCHAR(32)  |   供应商联系电话    |                                                       |
|      status      |   TINYINT    | 状态：1 上架 0 下架 |                       DEFAULT 1                       |
|   create_time    |   DATETIME   |      创建时间       |               DEFAULT CURRENT_TIMESTAMP               |
|   update_time    |   DATETIME   |      更新时间       | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 4. welfare_activity 福利活动表

表格







|    字段名     |     类型     |                   说明                    |                         约束                          |
| :-----------: | :----------: | :---------------------------------------: | :---------------------------------------------------: |
|      id       |    BIGINT    |                  主键 ID                  |              PRIMARY KEY, AUTO_INCREMENT              |
| activity_name | VARCHAR(128) |                 活动名称                  |                       NOT NULL                        |
| activity_type | VARCHAR(32)  |                 活动类型                  |                       NOT NULL                        |
|  start_time   |   DATETIME   |               活动开始时间                |                       NOT NULL                        |
|   end_time    |   DATETIME   |               活动结束时间                |                       NOT NULL                        |
|  limit_count  |     INT      |               每人限选数量                |                       DEFAULT 1                       |
|  description  |     TEXT     |                 活动说明                  |                                                       |
|    status     |   TINYINT    | 状态：0 未开始 1 进行中 2 已结束 3 已停用 |                       DEFAULT 0                       |
|   create_by   |    BIGINT    |                 创建人 ID                 |                                                       |
|  create_time  |   DATETIME   |                 创建时间                  |               DEFAULT CURRENT_TIMESTAMP               |
|  update_time  |   DATETIME   |                 更新时间                  | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 5. activity_gift_rel 活动 - 礼品关联表

表格







|   字段名    |   类型   |   说明   |            约束             |
| :---------: | :------: | :------: | :-------------------------: |
|     id      |  BIGINT  | 主键 ID  | PRIMARY KEY, AUTO_INCREMENT |
| activity_id |  BIGINT  | 活动 ID  |          NOT NULL           |
|   gift_id   |  BIGINT  | 礼品 ID  |          NOT NULL           |
| create_time | DATETIME | 创建时间 |  DEFAULT CURRENT_TIMESTAMP  |

#### 6. user_address 用户收货地址表

表格







|     字段名     |     类型     |        说明         |                         约束                          |
| :------------: | :----------: | :-----------------: | :---------------------------------------------------: |
|       id       |    BIGINT    |       主键 ID       |              PRIMARY KEY, AUTO_INCREMENT              |
|    user_id     |    BIGINT    |       用户 ID       |                       NOT NULL                        |
|    receiver    | VARCHAR(64)  |     收货人姓名      |                       NOT NULL                        |
|     phone      | VARCHAR(32)  |     收货人电话      |                       NOT NULL                        |
|    province    | VARCHAR(64)  |        省份         |                       NOT NULL                        |
|      city      | VARCHAR(64)  |        城市         |                       NOT NULL                        |
|    district    | VARCHAR(64)  |        区县         |                       NOT NULL                        |
| detail_address | VARCHAR(255) |      详细地址       |                       NOT NULL                        |
|   is_default   |   TINYINT    | 是否默认：1 是 0 否 |                       DEFAULT 0                       |
|  create_time   |   DATETIME   |      创建时间       |               DEFAULT CURRENT_TIMESTAMP               |
|  update_time   |   DATETIME   |      更新时间       | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 7. welfare_apply 福利申领主表

表格







|      字段名       |     类型     |                   说明                    |                         约束                          |
| :---------------: | :----------: | :---------------------------------------: | :---------------------------------------------------: |
|        id         |    BIGINT    |                  主键 ID                  |              PRIMARY KEY, AUTO_INCREMENT              |
|    activity_id    |    BIGINT    |                  活动 ID                  |                       NOT NULL                        |
|      user_id      |    BIGINT    |                申领用户 ID                |                       NOT NULL                        |
|    total_count    |     INT      |                申领总数量                 |                       NOT NULL                        |
| receiver_snapshot | VARCHAR(64)  |                收货人快照                 |                       NOT NULL                        |
|  phone_snapshot   | VARCHAR(32)  |               联系电话快照                |                       NOT NULL                        |
| address_snapshot  | VARCHAR(512) |               完整地址快照                |                       NOT NULL                        |
|   apply_status    |   TINYINT    | 状态：1 待发货 2 已发货 3 已签收 4 已取消 |                       DEFAULT 1                       |
|  express_company  | VARCHAR(64)  |                 物流公司                  |                                                       |
|    express_no     | VARCHAR(64)  |                 快递单号                  |                                                       |
|   deliver_time    |   DATETIME   |                 发货时间                  |                                                       |
|     sign_time     |   DATETIME   |                 签收时间                  |                                                       |
|     feedback      |     TEXT     |               问题反馈内容                |                                                       |
|    create_time    |   DATETIME   |                 申领时间                  |               DEFAULT CURRENT_TIMESTAMP               |
|    update_time    |   DATETIME   |                 更新时间                  | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

#### 8. welfare_apply_item 福利申领明细表

表格







|       字段名       |     类型     |     说明     |            约束             |
| :----------------: | :----------: | :----------: | :-------------------------: |
|         id         |    BIGINT    |   主键 ID    | PRIMARY KEY, AUTO_INCREMENT |
|      apply_id      |    BIGINT    | 申领主表 ID  |          NOT NULL           |
|      gift_id       |    BIGINT    |   礼品 ID    |          NOT NULL           |
| gift_name_snapshot | VARCHAR(128) | 礼品名称快照 |          NOT NULL           |
|   spec_snapshot    | VARCHAR(255) | 礼品规格快照 |                             |
|      quantity      |     INT      |   申领数量   |          NOT NULL           |
|    create_time     |   DATETIME   |   创建时间   |  DEFAULT CURRENT_TIMESTAMP  |

------

## 05 API 接口规范

### 5.1 通用规范

- 接口风格：RESTful API
- 请求格式：`application/json`
- 统一响应格式：

json







```
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

- 全局状态码：200 成功、400 参数错误、401 未登录、403 无权限、404 资源不存在、500 服务器错误
- 鉴权方式：需要登录的接口，请求头携带 `Authorization: Bearer {token}`

### 5.2 接口分类清单

#### 一、认证模块

1. `POST /api/auth/login` - 用户登录
2. `POST /api/auth/logout` - 用户登出
3. `GET /api/auth/userinfo` - 获取当前用户信息

#### 二、用户管理模块（管理员）

1. `GET /api/users` - 用户列表分页查询
2. `POST /api/users` - 新增用户
3. `PUT /api/users/{id}` - 编辑用户
4. `DELETE /api/users/{id}` - 删除用户
5. `PUT /api/users/{id}/reset-password` - 重置用户密码

#### 三、礼品管理模块

1. `GET /api/gifts` - 礼品列表分页查询
2. `GET /api/gifts/{id}` - 礼品详情
3. `POST /api/gifts` - 新增礼品
4. `PUT /api/gifts/{id}` - 编辑礼品
5. `DELETE /api/gifts/{id}` - 删除礼品
6. `PUT /api/gifts/{id}/status` - 礼品上下架

#### 四、福利活动模块

1. `GET /api/activities` - 活动列表分页查询
2. `GET /api/activities/{id}` - 活动详情
3. `POST /api/activities` - 新增活动
4. `PUT /api/activities/{id}` - 编辑活动
5. `PUT /api/activities/{id}/status` - 启停活动
6. `GET /api/activities/{id}/gifts` - 获取活动可选礼品列表
7. `PUT /api/activities/{id}/gifts` - 配置活动可选礼品

#### 五、地址管理模块

1. `GET /api/addresses` - 我的地址列表
2. `POST /api/addresses` - 新增地址
3. `PUT /api/addresses/{id}` - 编辑地址
4. `DELETE /api/addresses/{id}` - 删除地址
5. `PUT /api/addresses/{id}/default` - 设置为默认地址

#### 六、申领业务模块

1. `GET /api/apply/my-list` - 我的申领列表
2. `GET /api/apply/{id}` - 申领详情
3. `POST /api/apply` - 提交申领
4. `PUT /api/apply/{id}` - 修改申领
5. `GET /api/apply/list` - 申领列表（HR / 管理员）

#### 七、发货与签收模块

1. `PUT /api/deliver/{id}` - 更新单条发货信息
2. `PUT /api/deliver/batch` - 批量发货
3. `PUT /api/sign/{id}` - 确认签收并提交反馈

#### 八、统计与导出模块

1. `GET /api/statistics/dashboard` - 看板统计数据
2. `GET /api/export/apply/{activityId}` - 导出活动申领明细
3. `GET /api/export/statistics` - 导出统计报表

------

## 06 测试验收标准

### 6.1 功能测试要点

1. **权限校验**：不同角色登录后菜单与数据范围匹配，越权访问接口被正常拦截
2. **全流程闭环**：创建活动→员工申领→修改申领→活动结束锁定→发货→签收反馈，全流程业务通顺
3. **库存一致性**：提交申领扣减库存，修改申领同步调整库存，库存不足时禁止提交
4. **发货同步**：HR 更新发货状态与快递单号后，员工端实时同步展示
5. **导出准确性**：导出文件字段完整、数据准确，格式符合要求
6. **地址独立性**：删除 / 修改地址不影响历史申领单的地址快照

### 6.2 非功能要求

- 页面首屏加载时间 < 2s，普通接口响应时间 < 500ms
- 支持 100 人同时在线申领无卡顿、无库存超卖
- 兼容 Chrome、Edge 主流浏览器，PC 端优先适配
- 密码加密存储，敏感数据脱敏展示

------

## 07 开发交付物清单

1. 前端项目完整源代码（Vue3 工程）
2. 后端项目完整源代码（Node.js 工程）
3. 数据库初始化 SQL 脚本（含基础角色与测试账号）
4. 接口文档（自动生成或手动整理）
5. 本地部署与生产部署说明文档
6. 系统用户使用手册



  **08 目录结构及命名要求：**

所有文件按以下目录结构归档

1. 01-PRD文档
2. 02-技术方案
3. 03-测试报告
4. 04-AI对话记录
5. 05-项目源代码