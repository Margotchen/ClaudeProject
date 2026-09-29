package com.edu.platform.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.edu.platform.common.PageResult;
import com.edu.platform.common.Result;
import com.edu.platform.dto.InteractionQueryDTO;
import com.edu.platform.service.LiveInteractionService;
import com.edu.platform.vo.InteractionVO;
import com.edu.platform.vo.VoteResultVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 互动消息接口（历史记录、投票结果）
 */
@RestController
@RequestMapping("/api/live/interaction")
@RequiredArgsConstructor
public class LiveInteractionController {

    private final LiveInteractionService liveInteractionService;

    @GetMapping("/page")
    public Result<PageResult<InteractionVO>> page(@Valid InteractionQueryDTO query) {
        Page<InteractionVO> page = liveInteractionService.pageMessages(query);
        return Result.success(PageResult.of(page));
    }

    @GetMapping("/vote/{voteId}")
    public Result<VoteResultVO> voteResult(@PathVariable String voteId) {
        return Result.success(liveInteractionService.getVoteResult(voteId));
    }
}
