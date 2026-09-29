package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.MsgType;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.InteractionQueryDTO;
import com.edu.platform.entity.LiveInteraction;
import com.edu.platform.entity.LiveSchedule;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.LiveInteractionMapper;
import com.edu.platform.mapper.LiveScheduleMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.service.LiveInteractionService;
import com.edu.platform.service.LiveScheduleService;
import com.edu.platform.vo.InteractionVO;
import com.edu.platform.vo.VoteResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LiveInteractionServiceImpl extends ServiceImpl<LiveInteractionMapper, LiveInteraction>
        implements LiveInteractionService {

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final LiveScheduleMapper liveScheduleMapper;
    private final SysUserMapper sysUserMapper;
    private final CourseService courseService;
    private final LiveScheduleService liveScheduleService;

    @Override
    public String handleMessage(Long scheduleId, LoginUser user, String type, String bizId, String content, String extra) {
        // 排课必须存在；产生新互动数据的操作仅直播中允许（取消举手/结束投票属于收尾清理，放行）
        LiveSchedule schedule = liveScheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            throw new BizException("排课不存在");
        }
        boolean writeOp = switch (type) {
            case MsgType.DANMAKU, MsgType.QUESTION, MsgType.HAND_RAISE, MsgType.VOTE_START, MsgType.VOTE_SUBMIT -> true;
            case MsgType.HAND_RAISE_CANCEL, MsgType.VOTE_END -> false;
            default -> throw new BizException("不支持的消息类型：" + type);
        };
        if (writeOp && (schedule.getStatus() == null || schedule.getStatus() != 1)) {
            throw new BizException("直播未在进行中，无法互动");
        }
        return switch (type) {
            case MsgType.DANMAKU, MsgType.QUESTION -> handleChat(scheduleId, user, type, content);
            case MsgType.HAND_RAISE -> handleHandRaise(scheduleId, user);
            case MsgType.HAND_RAISE_CANCEL -> handleHandRaiseCancel(scheduleId, user, extra);
            case MsgType.VOTE_START -> handleVoteStart(scheduleId, user, content, extra);
            case MsgType.VOTE_SUBMIT -> handleVoteSubmit(user, bizId, extra);
            case MsgType.VOTE_END -> handleVoteEnd(scheduleId, user, bizId);
            default -> throw new BizException("不支持的消息类型：" + type);
        };
    }

    /**
     * 弹幕 / 提问
     */
    private String handleChat(Long scheduleId, LoginUser user, String type, String content) {
        if (StrUtil.isBlank(content)) {
            throw new BizException("消息内容不能为空");
        }
        if (content.length() > 200) {
            throw new BizException("消息内容不能超过200字");
        }
        LiveInteraction saved = persist(scheduleId, user, type, null, content.trim(), null);
        return buildPayload(type, toMap(saved, user));
    }

    /**
     * 举手（同一房间重复举手幂等拒绝）
     */
    private String handleHandRaise(Long scheduleId, LoginUser user) {
        long count = this.count(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getScheduleId, scheduleId)
                .eq(LiveInteraction::getUserId, user.getUserId())
                .eq(LiveInteraction::getMsgType, MsgType.HAND_RAISE));
        if (count > 0) {
            throw new BizException("你已举手，请等待讲师处理");
        }
        LiveInteraction saved = persist(scheduleId, user, MsgType.HAND_RAISE, null, null, null);
        return buildPayload(MsgType.HAND_RAISE, toMap(saved, user));
    }

    /**
     * 取消举手：学生取消自己的举手；讲师/管理员可通过 extra.targetUserId 处理学生举手（下麦）
     */
    private String handleHandRaiseCancel(Long scheduleId, LoginUser user, String extra) {
        Long targetUserId = user.getUserId();
        String targetName = user.getRealName();
        if (StrUtil.isNotBlank(extra)) {
            Long specified = JSONUtil.parseObj(extra).getLong("targetUserId");
            if (specified != null && !specified.equals(user.getUserId())) {
                // 代取消他人举手需要房间管理权限
                checkRoomManageable(scheduleId, user);
                targetUserId = specified;
                SysUser target = sysUserMapper.selectById(specified);
                targetName = target == null ? "?" : target.getRealName();
            }
        }
        this.remove(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getScheduleId, scheduleId)
                .eq(LiveInteraction::getUserId, targetUserId)
                .eq(LiveInteraction::getMsgType, MsgType.HAND_RAISE));
        Map<String, Object> data = new HashMap<>();
        data.put("userId", targetUserId);
        data.put("realName", targetName);
        return buildPayload(MsgType.HAND_RAISE_CANCEL, data);
    }

    /**
     * 发起投票（讲师/管理员，讲师仅自己课程的房间）
     */
    private String handleVoteStart(Long scheduleId, LoginUser user, String title, String extra) {
        checkRoomManageable(scheduleId, user);
        if (StrUtil.isBlank(title)) {
            throw new BizException("投票标题不能为空");
        }
        JSONArray options = parseOptions(extra);
        String voteId = IdUtil.fastSimpleUUID();
        JSONObject extraJson = JSONUtil.createObj()
                .set("title", title.trim())
                .set("options", options);
        persist(scheduleId, user, MsgType.VOTE_START, voteId, title.trim(), extraJson.toString());
        Map<String, Object> data = new HashMap<>();
        data.put("voteId", voteId);
        data.put("title", title.trim());
        data.put("options", options);
        data.put("initiator", user.getRealName());
        return buildPayload(MsgType.VOTE_START, data);
    }

    /**
     * 提交投票（每人每投票限一次，数据库唯一约束兜底防并发重复）
     */
    private String handleVoteSubmit(LoginUser user, String voteId, String extra) {
        LiveInteraction vote = requireActiveVote(voteId);
        Integer optionIndex = parseOptionIndex(extra);
        JSONArray options = JSONUtil.parseObj(vote.getExtra()).getJSONArray("options");
        if (optionIndex < 0 || optionIndex >= options.size()) {
            throw new BizException("投票选项非法");
        }
        long submitted = this.count(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getUserId, user.getUserId())
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_SUBMIT));
        if (submitted > 0) {
            throw new BizException("你已提交过该投票");
        }
        JSONObject extraJson = JSONUtil.createObj().set("optionIndex", optionIndex);
        try {
            persist(vote.getScheduleId(), user, MsgType.VOTE_SUBMIT, voteId, null, extraJson.toString());
        } catch (DuplicateKeyException e) {
            // 并发双击触发唯一约束 uk_vote_submit
            throw new BizException("你已提交过该投票");
        }
        return buildPayload(MsgType.VOTE_RESULT, toResultMap(voteId));
    }

    /**
     * 结束投票（讲师/管理员）
     */
    private String handleVoteEnd(Long scheduleId, LoginUser user, String voteId) {
        checkRoomManageable(scheduleId, user);
        requireActiveVote(voteId);
        persist(scheduleId, user, MsgType.VOTE_END, voteId, null, null);
        Map<String, Object> data = toResultMap(voteId);
        data.put("ended", true);
        return buildPayload(MsgType.VOTE_END, data);
    }

    @Override
    public Page<InteractionVO> pageMessages(InteractionQueryDTO query) {
        liveScheduleService.checkRoomAccessible(query.getScheduleId(), SecurityUtils.getCurrentUser());
        Page<LiveInteraction> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<LiveInteraction> wrapper = new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getScheduleId, query.getScheduleId())
                .eq(StrUtil.isNotBlank(query.getMsgType()), LiveInteraction::getMsgType, query.getMsgType())
                .orderByDesc(LiveInteraction::getId);
        Page<LiveInteraction> messagePage = this.page(page, wrapper);

        List<Long> userIds = messagePage.getRecords().stream()
                .map(LiveInteraction::getUserId).distinct().collect(Collectors.toList());
        Map<Long, SysUser> userMap = userIds.isEmpty() ? Map.of()
                : sysUserMapper.selectBatchIds(userIds).stream().collect(Collectors.toMap(SysUser::getId, u -> u));
        Map<Long, String> roleCodeMap = new HashMap<>();
        userMap.keySet().forEach(id -> roleCodeMap.put(id, sysUserMapper.selectRoleCodeByUserId(id)));

        Page<InteractionVO> result = new Page<>(messagePage.getCurrent(), messagePage.getSize(), messagePage.getTotal());
        result.setRecords(messagePage.getRecords().stream().map(m -> {
            InteractionVO vo = BeanUtil.copyProperties(m, InteractionVO.class);
            SysUser u = userMap.get(m.getUserId());
            if (u != null) {
                vo.setRealName(u.getRealName());
                vo.setRoleCode(roleCodeMap.get(m.getUserId()));
            }
            return vo;
        }).collect(Collectors.toList()));
        return result;
    }

    @Override
    public VoteResultVO getVoteResult(String voteId) {
        LiveInteraction vote = this.getOne(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_START));
        if (vote == null) {
            throw new BizException("投票不存在");
        }
        liveScheduleService.checkRoomAccessible(vote.getScheduleId(), SecurityUtils.getCurrentUser());
        JSONObject extra = JSONUtil.parseObj(vote.getExtra());
        VoteResultVO vo = new VoteResultVO();
        vo.setVoteId(voteId);
        vo.setTitle(extra.getStr("title"));
        vo.setOptions(extra.getJSONArray("options").toList(String.class));
        Map<String, Object> resultMap = toResultMap(voteId);
        @SuppressWarnings("unchecked")
        List<Integer> counts = (List<Integer>) resultMap.get("counts");
        vo.setCounts(counts);
        vo.setTotal((Integer) resultMap.get("total"));
        vo.setEnded((Boolean) resultMap.get("ended"));
        return vo;
    }

    // ---------- 私有方法 ----------

    /**
     * 校验当前用户有权管理该房间（管理员任意，讲师仅自己课程）
     */
    private void checkRoomManageable(Long scheduleId, LoginUser user) {
        if ("ADMIN".equals(user.getRoleCode())) {
            return;
        }
        if (!"TEACHER".equals(user.getRoleCode())) {
            throw new BizException("仅讲师可执行该操作");
        }
        LiveSchedule schedule = liveScheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            throw new BizException("排课不存在");
        }
        // checkManageable 内部已处理讲师归属校验
        courseService.checkManageable(schedule.getCourseId());
    }

    /**
     * 校验投票存在且未结束
     */
    private LiveInteraction requireActiveVote(String voteId) {
        if (StrUtil.isBlank(voteId)) {
            throw new BizException("投票ID不能为空");
        }
        LiveInteraction vote = this.getOne(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_START));
        if (vote == null) {
            throw new BizException("投票不存在");
        }
        long ended = this.count(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_END));
        if (ended > 0) {
            throw new BizException("投票已结束");
        }
        return vote;
    }

    /**
     * 统计投票结果：counts / total / ended
     */
    private Map<String, Object> toResultMap(String voteId) {
        LiveInteraction vote = this.getOne(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_START));
        JSONArray options = JSONUtil.parseObj(vote.getExtra()).getJSONArray("options");
        List<Integer> counts = new ArrayList<>(java.util.Collections.nCopies(options.size(), 0));
        List<LiveInteraction> submits = this.list(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_SUBMIT));
        int total = 0;
        for (LiveInteraction submit : submits) {
            Integer idx = JSONUtil.parseObj(submit.getExtra()).getInt("optionIndex");
            if (idx != null && idx >= 0 && idx < counts.size()) {
                counts.set(idx, counts.get(idx) + 1);
                total++;
            }
        }
        long ended = this.count(new LambdaQueryWrapper<LiveInteraction>()
                .eq(LiveInteraction::getBizId, voteId)
                .eq(LiveInteraction::getMsgType, MsgType.VOTE_END));
        Map<String, Object> map = new HashMap<>();
        map.put("voteId", voteId);
        map.put("counts", counts);
        map.put("total", total);
        map.put("ended", ended > 0);
        return map;
    }

    private JSONArray parseOptions(String extra) {
        if (StrUtil.isBlank(extra)) {
            throw new BizException("投票选项不能为空");
        }
        JSONArray options = JSONUtil.parseObj(extra).getJSONArray("options");
        if (options == null || options.size() < 2 || options.size() > 6) {
            throw new BizException("投票选项需为2~6个");
        }
        return options;
    }

    private Integer parseOptionIndex(String extra) {
        if (StrUtil.isBlank(extra)) {
            throw new BizException("投票选项不能为空");
        }
        Integer optionIndex = JSONUtil.parseObj(extra).getInt("optionIndex");
        if (optionIndex == null) {
            throw new BizException("投票选项不能为空");
        }
        return optionIndex;
    }

    private LiveInteraction persist(Long scheduleId, LoginUser user, String type, String bizId, String content, String extra) {
        LiveInteraction entity = new LiveInteraction();
        entity.setScheduleId(scheduleId);
        entity.setUserId(user.getUserId());
        entity.setMsgType(type);
        entity.setBizId(bizId);
        entity.setContent(content);
        entity.setExtra(extra);
        entity.setCreateTime(LocalDateTime.now());
        this.save(entity);
        return entity;
    }

    private Map<String, Object> toMap(LiveInteraction entity, LoginUser user) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", entity.getId());
        data.put("msgType", entity.getMsgType());
        data.put("userId", user.getUserId());
        data.put("realName", user.getRealName());
        data.put("roleCode", user.getRoleCode());
        data.put("content", entity.getContent());
        data.put("createTime", entity.getCreateTime().format(TIME_FMT));
        return data;
    }

    private String buildPayload(String type, Map<String, Object> data) {
        return JSONUtil.createObj()
                .set("type", type)
                .set("data", data)
                .set("time", LocalDateTime.now().format(TIME_FMT))
                .toString();
    }
}
