# 停车位预约管理系统 - 接口设计文档

## 基础信息

- 基础路径：`/api`
- 鉴权方式：Header 携带 `Authorization: Bearer {token}`
- 统一响应：`{ code, message, data, timestamp }`

## 认证模块

### POST /api/auth/login

登录。

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应：**

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "...",
    "user": { "id": 1, "username": "admin", "realName": "系统管理员", "role": "system_admin" }
  }
}
```

### GET /api/auth/profile

获取当前用户信息。

**响应：**

```json
{
  "code": 200,
  "data": { "id": 1, "username": "admin", "real_name": "系统管理员", "role": "system_admin", "violation_count": 0, "ban_until": null }
}
```

## 用户模块

### GET /api/users

用户列表（system_admin）。

**请求参数：** keyword, role, page, pageSize

### POST /api/users

创建用户（system_admin）。

**请求参数：** username, password, realName, employeeNo, departmentId, phone, role

### PUT /api/users/:id

更新用户（system_admin）。

### POST /api/users/:id/reset-password

重置密码（system_admin）。

**请求参数：** password

### POST /api/users/:id/unban

解除封禁（system_admin / parking_admin）。

### GET /api/users/departments

部门列表（已登录）。

## 车辆模块

### GET /api/vehicles

当前用户车辆列表。

### POST /api/vehicles

添加车辆。

**请求参数：** plateNumber, carType, color, isDefault

### PUT /api/vehicles/:id

更新车辆。

### DELETE /api/vehicles/:id

删除车辆。

## 车位模块

### GET /api/spots

车位列表。

**请求参数：** areaId, spotType, status, keyword, page, pageSize

### GET /api/spots/areas

区域列表。

### GET /api/spots/map-status

地图状态。

**请求参数：** date, timeSlot

### POST /api/spots

创建车位（parking_admin / system_admin）。

### PUT /api/spots/:id

更新车位。

### DELETE /api/spots/:id

删除车位（system_admin）。

## 预约模块

### POST /api/reservations

创建预约。

**请求参数：** spotId, vehicleId, reserveDate, timeSlot

### GET /api/reservations/my

我的预约。

**请求参数：** status, page, pageSize

### GET /api/reservations

全部预约（管理员）。

### POST /api/reservations/:id/cancel

取消预约。

### POST /api/reservations/:id/checkin

核销预约。

### POST /api/reservations/checkin-by-plate

车牌核销（管理员）。

**请求参数：** plateNumber

## 违约模块

### GET /api/violations

违约列表（管理员）。

### POST /api/violations/:id/pardon

减免违约。

## 统计模块

### GET /api/stats/overview

概览统计。

### GET /api/stats/area-utilization

区域使用率。

### GET /api/stats/time-trend

时段趋势。

### GET /api/stats/details

详细数据。

### GET /api/stats/export

导出 CSV。

## 配置模块

### GET /api/configs

配置列表（system_admin）。

### PUT /api/configs/:key

更新配置。

**请求参数：** configValue

## 日志模块

### GET /api/logs

操作日志（system_admin）。

**请求参数：** module, page, pageSize
