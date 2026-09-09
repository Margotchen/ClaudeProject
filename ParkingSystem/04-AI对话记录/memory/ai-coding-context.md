---
name: ai-coding-context
description: 指向项目已有的 AI Coding 对话上下文记录文档
metadata: 
  node_type: memory
  type: reference
  originSessionId: e35a85c1-c39c-4161-9350-314e12991c24
  modified: 2026-08-14T07:40:47.665Z
---

项目已维护一份 AI Coding 对话上下文记录：

- **文件路径**：`04-AI对话记录/08-AI-Coding-Context.md`
- **内容摘要**：记录了整个项目从需求确认、方案设计（Plan Mode + Explore/Plan Agent）、按 P0/P1 优先级分阶段开发到交付的完整 AI Coding 过程。
- **关键决策**：Vue3 + Node.js + SQLite 技术栈、JWT + RBAC 鉴权、数据库事务 + 唯一约束处理并发、node-cron 定时任务、每日预计算统计。

**Why:** 该文档是项目的“设计日志”，后续需要追溯最初为什么这样设计时可优先查阅。

**How to apply:**
- 在回答“为什么用 SQLite”“角色怎么设计的”“预约并发怎么保证”等问题前，先核对 `04-AI对话记录/08-AI-Coding-Context.md`。
- 若用户要求补充新的对话上下文，应更新本文档以及相关的 [[project-baseline]]、[[tech-architecture]]、[[business-rules]] 记忆。
