package com.edu.platform.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.MsgType;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.config.SrsProperties;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.LiveSchedule;
import com.edu.platform.entity.LiveSession;
import com.edu.platform.entity.PlaybackVideo;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.LiveScheduleMapper;
import com.edu.platform.mapper.LiveSessionMapper;
import com.edu.platform.mapper.PlaybackVideoMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.service.LiveScheduleService;
import com.edu.platform.service.LiveSessionService;
import com.edu.platform.vo.LiveRoomVO;
import com.edu.platform.websocket.LiveRoomManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LiveSessionServiceImpl extends ServiceImpl<LiveSessionMapper, LiveSession> implements LiveSessionService {

    private final LiveScheduleMapper liveScheduleMapper;
    private final SysUserMapper sysUserMapper;
    private final PlaybackVideoMapper playbackVideoMapper;
    private final CourseService courseService;
    private final LiveScheduleService liveScheduleService;
    private final LiveRoomManager roomManager;
    private final SrsProperties srsProperties;

    @Override
    public LiveRoomVO getRoomInfo(Long scheduleId) {
        LiveSchedule schedule = requireSchedule(scheduleId);
        LoginUser current = SecurityUtils.getCurrentUser();
        liveScheduleService.checkRoomAccessible(scheduleId, current);
        return buildRoomVO(schedule, current);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LiveRoomVO startLive(Long scheduleId) {
        LiveSchedule schedule = requireSchedule(scheduleId);
        courseService.checkManageable(schedule.getCourseId());
        if (schedule.getStatus() == null || schedule.getStatus() != 0) {
            throw new BizException("仅未开始的排课可开播");
        }
        // 关闭同一排课遗留的直播中会话（异常情况兜底）
        LiveSession legacy = getActiveSession(scheduleId);
        if (legacy != null) {
            closeSession(legacy);
        }
        LiveSession session = new LiveSession();
        session.setScheduleId(scheduleId);
        session.setStatus(1);
        session.setPushUrl(buildPushUrl(scheduleId));
        session.setPullUrl(buildPullUrl(scheduleId));
        session.setActualStartTime(LocalDateTime.now());
        this.save(session);

        LiveSchedule update = new LiveSchedule();
        update.setId(scheduleId);
        update.setStatus(1);
        liveScheduleMapper.updateById(update);

        broadcastLiveStatus(scheduleId, 1);
        LoginUser current = SecurityUtils.getCurrentUser();
        schedule.setStatus(1);
        return buildRoomVO(schedule, current);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void endLive(Long scheduleId) {
        LiveSchedule schedule = requireSchedule(scheduleId);
        courseService.checkManageable(schedule.getCourseId());
        if (schedule.getStatus() == null || schedule.getStatus() != 1) {
            throw new BizException("仅直播中的排课可结束");
        }
        LiveSession session = getActiveSession(scheduleId);
        if (session != null) {
            closeSession(session);
            // SRS on_dvr 回调可能先于 endLive 到达（推流先停），此时补录播时长
            fillPlaybackDuration(session);
        }
        LiveSchedule update = new LiveSchedule();
        update.setId(scheduleId);
        update.setStatus(2);
        liveScheduleMapper.updateById(update);
        broadcastLiveStatus(scheduleId, 2);
    }

    /**
     * 回填本会话关联录播的时长（会话实际开播~结束）
     */
    private void fillPlaybackDuration(LiveSession session) {
        if (session.getActualStartTime() == null || session.getEndTime() == null) {
            return;
        }
        int seconds = (int) java.time.Duration.between(session.getActualStartTime(), session.getEndTime()).getSeconds();
        List<PlaybackVideo> videos = playbackVideoMapper.selectList(new LambdaQueryWrapper<PlaybackVideo>()
                .eq(PlaybackVideo::getSessionId, session.getId())
                .isNull(PlaybackVideo::getDuration));
        for (PlaybackVideo v : videos) {
            PlaybackVideo update = new PlaybackVideo();
            update.setId(v.getId());
            update.setDuration(seconds);
            playbackVideoMapper.updateById(update);
        }
    }

    @Override
    public String getPushUrl(Long scheduleId) {
        requireSchedule(scheduleId);
        courseService.checkManageable(requireSchedule(scheduleId).getCourseId());
        return buildPushUrl(scheduleId);
    }

    @Override
    public String getPullUrl(Long scheduleId) {
        requireSchedule(scheduleId);
        liveScheduleService.checkRoomAccessible(scheduleId, SecurityUtils.getCurrentUser());
        return buildPullUrl(scheduleId);
    }

    private LiveRoomVO buildRoomVO(LiveSchedule schedule, LoginUser current) {
        Course course = courseService.getById(schedule.getCourseId());
        LiveRoomVO vo = new LiveRoomVO();
        vo.setScheduleId(schedule.getId());
        vo.setLiveTitle(schedule.getLiveTitle());
        vo.setCourseId(schedule.getCourseId());
        vo.setScheduleStatus(schedule.getStatus());
        vo.setStartTime(schedule.getStartTime());
        vo.setDuration(schedule.getDuration());
        if (course != null) {
            vo.setCourseName(course.getCourseName());
            SysUser teacher = sysUserMapper.selectById(course.getTeacherId());
            vo.setTeacherName(teacher == null ? null : teacher.getRealName());
        }
        LiveSession active = getActiveSession(schedule.getId());
        if (active != null) {
            vo.setSessionId(active.getId());
            vo.setActualStartTime(active.getActualStartTime());
            vo.setPullUrl(active.getPullUrl());
        }
        vo.setOnlineCount(roomManager.onlineCount(schedule.getId()));
        vo.setCanManage(canManage(current, course));
        vo.setSrsEnabled(srsProperties.isEnabled());
        return vo;
    }

    private boolean canManage(LoginUser current, Course course) {
        if ("ADMIN".equals(current.getRoleCode())) {
            return true;
        }
        return "TEACHER".equals(current.getRoleCode())
                && course != null
                && course.getTeacherId().equals(current.getUserId());
    }

    private LiveSchedule requireSchedule(Long scheduleId) {
        LiveSchedule schedule = liveScheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            throw new BizException("排课不存在");
        }
        return schedule;
    }

    private LiveSession getActiveSession(Long scheduleId) {
        return this.getOne(new LambdaQueryWrapper<LiveSession>()
                .eq(LiveSession::getScheduleId, scheduleId)
                .eq(LiveSession::getStatus, 1)
                .orderByDesc(LiveSession::getId)
                .last("LIMIT 1"));
    }

    private void closeSession(LiveSession session) {
        LocalDateTime now = LocalDateTime.now();
        LiveSession update = new LiveSession();
        update.setId(session.getId());
        update.setStatus(2);
        update.setEndTime(now);
        this.updateById(update);
        // 回写内存对象，供回填录播时长使用
        session.setStatus(2);
        session.setEndTime(now);
    }

    private void broadcastLiveStatus(Long scheduleId, Integer status) {
        roomManager.broadcast(scheduleId, JSONUtil.createObj()
                .set("type", MsgType.LIVE_STATUS)
                .set("data", Map.of("status", status))
                .toString());
    }

    private String buildPushUrl(Long scheduleId) {
        return srsProperties.getWhipUrl() + "schedule_" + scheduleId;
    }

    private String buildPullUrl(Long scheduleId) {
        return srsProperties.getWhepUrl() + "schedule_" + scheduleId;
    }
}
