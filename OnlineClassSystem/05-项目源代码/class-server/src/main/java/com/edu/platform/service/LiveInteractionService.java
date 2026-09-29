package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.edu.platform.dto.InteractionQueryDTO;
import com.edu.platform.security.LoginUser;
import com.edu.platform.vo.InteractionVO;
import com.edu.platform.vo.VoteResultVO;

/**
 * 互动消息服务
 */
public interface LiveInteractionService {

    /**
     * 处理 WebSocket 客户端消息：校验权限、落库，返回需要广播的 JSON payload
     *
     * @return 广播 payload（JSON 字符串），null 表示无需广播
     */
    String handleMessage(Long scheduleId, LoginUser user, String type, String bizId, String content, String extra);

    /**
     * 分页查询历史互动消息（按时间倒序）
     */
    Page<InteractionVO> pageMessages(InteractionQueryDTO query);

    /**
     * 查询投票结果
     */
    VoteResultVO getVoteResult(String voteId);
}
