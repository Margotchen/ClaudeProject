-- =============================================================
-- 缺陷修复：投票提交防并发重复（唯一约束兜底）
-- =============================================================
USE online_class;

-- 每人每投票限一条提交记录；biz_id 为 NULL 的消息（弹幕/提问/举手）不受约束
ALTER TABLE live_interaction
    ADD UNIQUE KEY uk_vote_submit (biz_id, user_id, msg_type);
