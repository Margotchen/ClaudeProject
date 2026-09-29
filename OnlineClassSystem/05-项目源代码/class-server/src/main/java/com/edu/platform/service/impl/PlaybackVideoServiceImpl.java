package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.config.RecordProperties;
import com.edu.platform.dto.PlaybackQueryDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.LiveSchedule;
import com.edu.platform.entity.LiveSession;
import com.edu.platform.entity.PlaybackVideo;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.LiveScheduleMapper;
import com.edu.platform.mapper.LiveSessionMapper;
import com.edu.platform.mapper.PlaybackVideoMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.service.PlaybackVideoService;
import com.edu.platform.vo.PlaybackVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaybackVideoServiceImpl extends ServiceImpl<PlaybackVideoMapper, PlaybackVideo>
        implements PlaybackVideoService {

    private final CourseMapper courseMapper;
    private final LiveScheduleMapper liveScheduleMapper;
    private final LiveSessionMapper liveSessionMapper;
    private final SysUserMapper sysUserMapper;
    private final CourseService courseService;
    private final RecordProperties recordProperties;

    @Override
    public Page<PlaybackVO> pagePlayback(PlaybackQueryDTO query) {
        LoginUser current = SecurityUtils.getCurrentUser();
        // 角色数据范围前置到 SQL：学生仅上架课程，讲师仅自己课程
        List<Long> visibleCourseIds = resolveVisibleCourseIds(current);
        if (visibleCourseIds != null && visibleCourseIds.isEmpty()) {
            return new Page<>(query.getPageNum(), query.getPageSize(), 0);
        }
        Page<PlaybackVideo> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<PlaybackVideo> wrapper = new LambdaQueryWrapper<PlaybackVideo>()
                .in(visibleCourseIds != null, PlaybackVideo::getCourseId, visibleCourseIds)
                .eq(query.getCourseId() != null, PlaybackVideo::getCourseId, query.getCourseId())
                // 学生仅见上架录播
                .eq("STUDENT".equals(current.getRoleCode()), PlaybackVideo::getStatus, 1)
                .eq(query.getStatus() != null && !"STUDENT".equals(current.getRoleCode()),
                        PlaybackVideo::getStatus, query.getStatus())
                .orderByDesc(PlaybackVideo::getId);
        Page<PlaybackVideo> videoPage = this.page(page, wrapper);

        List<PlaybackVideo> records = videoPage.getRecords();
        Map<Long, Course> courseMap = loadCourses(records);
        Map<Long, String> teacherNameMap = loadTeacherNames(courseMap);
        Map<Long, String> liveTitleMap = loadLiveTitles(records);

        Page<PlaybackVO> result = new Page<>(videoPage.getCurrent(), videoPage.getSize(), videoPage.getTotal());
        result.setRecords(records.stream().map(v -> {
            PlaybackVO vo = BeanUtil.copyProperties(v, PlaybackVO.class);
            Course course = courseMap.get(v.getCourseId());
            if (course != null) {
                vo.setCourseName(course.getCourseName());
                vo.setTeacherName(teacherNameMap.get(course.getTeacherId()));
            }
            vo.setLiveTitle(liveTitleMap.get(v.getScheduleId()));
            return vo;
        }).collect(Collectors.toList()));
        return result;
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new BizException("状态值非法");
        }
        PlaybackVideo video = requireManageable(id);
        PlaybackVideo update = new PlaybackVideo();
        update.setId(video.getId());
        update.setStatus(status);
        this.updateById(update);
    }

    @Override
    public void deletePlayback(Long id) {
        PlaybackVideo video = requireManageable(id);
        this.removeById(id);
        // 删除录制文件（失败不阻断，仅告警）
        try {
            Files.deleteIfExists(resolveFile(video.getFileName()));
        } catch (Exception e) {
            log.warn("删除录制文件失败：{}", video.getFileName(), e);
        }
    }

    @Override
    public void onDvrCallback(String stream, String file) {
        if (StrUtil.isBlank(stream) || !stream.startsWith("schedule_") || StrUtil.isBlank(file)) {
            log.warn("on_dvr 回调参数非法：stream={}, file={}", stream, file);
            return;
        }
        Long scheduleId;
        try {
            scheduleId = Long.valueOf(stream.substring("schedule_".length()));
        } catch (NumberFormatException e) {
            log.warn("on_dvr 回调流名无法解析：{}", stream);
            return;
        }
        LiveSchedule schedule = liveScheduleMapper.selectById(scheduleId);
        if (schedule == null) {
            log.warn("on_dvr 回调对应排课不存在：{}", scheduleId);
            return;
        }
        // 容器路径 /data/dvr/xxx → 相对路径 xxx
        String fileName = file.replace('\\', '/');
        int idx = fileName.indexOf("/data/dvr/");
        if (idx < 0) {
            log.warn("on_dvr 回调文件路径不在录制目录：{}", file);
            return;
        }
        fileName = fileName.substring(idx + "/data/dvr/".length());

        Path localFile = resolveFile(fileName);
        if (!Files.exists(localFile)) {
            log.warn("on_dvr 回调文件不存在：{}", localFile);
            return;
        }
        // 关联最近一次的直播会话
        LiveSession session = liveSessionMapper.selectOne(new LambdaQueryWrapper<LiveSession>()
                .eq(LiveSession::getScheduleId, scheduleId)
                .orderByDesc(LiveSession::getId)
                .last("LIMIT 1"));

        PlaybackVideo video = new PlaybackVideo();
        video.setCourseId(schedule.getCourseId());
        video.setScheduleId(scheduleId);
        video.setSessionId(session == null ? null : session.getId());
        video.setTitle(schedule.getLiveTitle());
        video.setFileName(fileName);
        try {
            video.setFileSize(Files.size(localFile));
        } catch (Exception ignored) {
        }
        if (session != null && session.getActualStartTime() != null && session.getEndTime() != null) {
            video.setDuration((int) Duration.between(session.getActualStartTime(), session.getEndTime()).getSeconds());
        }
        video.setStatus(1);
        try {
            this.save(video);
            log.info("录播生成成功：{}（{}字节）", video.getTitle(), video.getFileSize());
        } catch (DuplicateKeyException e) {
            // 同一文件重复回调（SRS 重试），幂等忽略
            log.info("on_dvr 重复回调，忽略：{}", fileName);
        }
    }

    @Override
    public PlaybackVideo getAccessible(Long id) {
        PlaybackVideo video = this.getById(id);
        if (video == null) {
            throw new BizException("录播不存在");
        }
        LoginUser current = SecurityUtils.getCurrentUser();
        Course course = courseMapper.selectById(video.getCourseId());
        if (course == null) {
            throw new BizException("课程不存在");
        }
        switch (current.getRoleCode()) {
            case "ADMIN", "HEAD_TEACHER" -> {
                return video;
            }
            case "TEACHER" -> {
                if (course.getTeacherId().equals(current.getUserId())) {
                    return video;
                }
            }
            case "STUDENT" -> {
                if (course.getStatus() != null && course.getStatus() == 1
                        && video.getStatus() != null && video.getStatus() == 1) {
                    return video;
                }
            }
            default -> {
            }
        }
        throw new BizException("无权访问该录播");
    }

    @Override
    public Path resolveFile(String fileName) {
        if (StrUtil.isBlank(fileName) || fileName.contains("..") || fileName.startsWith("/") || fileName.contains(":")) {
            throw new BizException("文件名非法");
        }
        Path root = Paths.get(recordProperties.getDir()).toAbsolutePath().normalize();
        Path path = root.resolve(fileName).normalize();
        if (!path.startsWith(root)) {
            throw new BizException("文件名非法");
        }
        return path;
    }

    /**
     * 校验录播存在且当前用户有权管理（管理员任意，讲师仅自己课程）
     */
    private PlaybackVideo requireManageable(Long id) {
        PlaybackVideo video = this.getById(id);
        if (video == null) {
            throw new BizException("录播不存在");
        }
        courseService.checkManageable(video.getCourseId());
        return video;
    }

    /**
     * 解析当前用户可见的课程ID集合；返回 null 表示不限制
     */
    private List<Long> resolveVisibleCourseIds(LoginUser current) {
        if ("TEACHER".equals(current.getRoleCode())) {
            return courseMapper.selectList(new LambdaQueryWrapper<Course>()
                            .eq(Course::getTeacherId, current.getUserId()))
                    .stream().map(Course::getId).collect(Collectors.toList());
        }
        if ("STUDENT".equals(current.getRoleCode())) {
            return courseMapper.selectList(new LambdaQueryWrapper<Course>()
                            .eq(Course::getStatus, 1))
                    .stream().map(Course::getId).collect(Collectors.toList());
        }
        return null;
    }

    private Map<Long, Course> loadCourses(List<PlaybackVideo> videos) {
        List<Long> courseIds = videos.stream().map(PlaybackVideo::getCourseId).distinct().collect(Collectors.toList());
        if (courseIds.isEmpty()) {
            return Map.of();
        }
        return courseMapper.selectBatchIds(courseIds).stream()
                .collect(Collectors.toMap(Course::getId, c -> c));
    }

    private Map<Long, String> loadTeacherNames(Map<Long, Course> courseMap) {
        List<Long> teacherIds = courseMap.values().stream().map(Course::getTeacherId).distinct().collect(Collectors.toList());
        if (teacherIds.isEmpty()) {
            return Map.of();
        }
        return sysUserMapper.selectBatchIds(teacherIds).stream()
                .collect(Collectors.toMap(SysUser::getId, SysUser::getRealName));
    }

    private Map<Long, String> loadLiveTitles(List<PlaybackVideo> videos) {
        List<Long> scheduleIds = videos.stream().map(PlaybackVideo::getScheduleId).distinct().collect(Collectors.toList());
        if (scheduleIds.isEmpty()) {
            return Map.of();
        }
        return liveScheduleMapper.selectBatchIds(scheduleIds).stream()
                .collect(Collectors.toMap(LiveSchedule::getId, LiveSchedule::getLiveTitle));
    }
}
