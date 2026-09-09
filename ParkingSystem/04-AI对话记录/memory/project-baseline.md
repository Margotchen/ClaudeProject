---
name: project-baseline
description: 停车位预约管理系统的项目基线与背景信息
metadata: 
  node_type: memory
  type: project
  originSessionId: e35a85c1-c39c-4161-9350-314e12991c24
  modified: 2026-08-14T07:40:07.174Z
---

本项目是**停车位预约管理系统**，面向企业园区停车场景，解决车位紧张、先到先得导致的通勤低效问题。系统支持错峰预约、可视化车位地图、入场核销、违约风控和多角色权限管理。

**Why:** 园区仅约 200 个车位，员工车辆超过 400 辆，需要预约制提升周转率；未来会话中任何改动都应围绕这一业务目标，避免引入与园区停车管理无关的复杂功能。

**How to apply:**
- 新增功能前优先核对 PRD（`01-PRD文档/01-PRD.md`）是否已覆盖该需求。
- 保持前后端分离架构，不要混用技术栈或将后端逻辑移到前端。
- 角色权限沿用员工 / 车位管理员 / 系统管理员三级体系，避免新增不必要的角色层级。
- 详细 AI Coding 上下文见 [[ai-coding-context]]，技术栈与目录结构见 [[tech-architecture]]，业务规则见 [[business-rules]]。
