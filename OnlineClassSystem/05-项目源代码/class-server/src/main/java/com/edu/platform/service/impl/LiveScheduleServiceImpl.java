package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.ScheduleQueryDTO;
import com.edu.platform.dto.ScheduleSaveDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.LiveSchedule;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.LiveScheduleMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.service.LiveScheduleService;
import com.edu.platform.vo.ScheduleVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LiveScheduleServiceImpl extends ServiceImpl<LiveScheduleMapper, LiveSchedule> implements LiveScheduleService {

    private final CourseService courseService;
    private final CourseMapper courseMapper;
    private final SysUserMapper sysUserMapper;

    @Override
    public Page<ScheduleVO> pageSchedules(ScheduleQueryDTO query) {
        LoginUser current = SecurityUtils.getCurrentUser();
        // 角色数据范围前置到 SQL，保证分页 total 正确：
        // 学生仅可见上架课程的排课；讲师仅可见自己课程的排课
        List<Long> visibleCourseIds = resolveVisibleCourseIds(current);
        if (visibleCourseIds != null && visibleCourseIds.isEmpty()) {
            return new Page<>(query.getPageNum(), query.getPageSize(), 0);
        }
        Page<LiveSchedule> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<LiveSchedule> wrapper = new LambdaQueryWrapper<LiveSchedule>()
                .in(visibleCourseIds != null, LiveSchedule::getCourseId, visibleCourseIds)
                .eq(query.getCourseId() != null, LiveSchedule::getCourseId, query.getCourseId())
                .eq(query.getStatus() != null, LiveSchedule::getStatus, query.getStatus())
                .ge(StrUtil.isNotBlank(query.getStartDate()), LiveSchedule::getStartTime,
                        StrUtil.isNotBlank(query.getStartDate()) ? LocalDate.parse(query.getStartDate()).atStartOfDay() : null)
                .le(StrUtil.isNotBlank(query.getEndDate()), LiveSchedule::getStartTime,
                        StrUtil.isNotBlank(query.getEndDate()) ? LocalDate.parse(query.getEndDate()).atTime(LocalTime.MAX) : null)
                .orderByAsc(LiveSchedule::getStartTime);
        Page<LiveSchedule> schedulePage = this.page(page, wrapper);

        List<LiveSchedule> records = schedulePage.getRecords();
        Map<Long, Course> courseMap = loadCourses(records);
        Map<Long, String> teacherNameMap = loadTeacherNames(courseMap);

        Page<ScheduleVO> result = new Page<>(schedulePage.getCurrent(), schedulePage.getSize(), schedulePage.getTotal());
        result.setRecords(records.stream().map(s -> toVO(s, courseMap, teacherNameMap)).collect(Collectors.toList()));
        return result;
    }

    /**
     * 解析当前用户可见的课程ID集合；返回 null 表示不限制（管理员/班主任）
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

    @Override
    public void createSchedule(ScheduleSaveDTO dto) {
        // 校验课程存在且当前用户有权管理（讲师仅自己的课程）
        courseService.checkManageable(dto.getCourseId());
        if (dto.getStartTime().isBefore(java.time.LocalDateTime.now())) {
            throw new BizException("开播时间不能早于当前时间");
        }
        LiveSchedule schedule = BeanUtil.copyProperties(dto, LiveSchedule.class);
        schedule.setId(null);
        schedule.setStatus(0);
        this.save(schedule);
    }

    @Override
    public void updateSchedule(ScheduleSaveDTO dto) {
        if (dto.getId() == null) {
            throw new BizException("排课ID不能为空");
        }
        LiveSchedule exist = this.getById(dto.getId());
        if (exist == null) {
            throw new BizException("排课不存在");
        }
        if (exist.getStatus() != null && exist.getStatus() != 0) {
            throw new BizException("仅未开始的排课可编辑");
        }
        courseService.checkManageable(exist.getCourseId());
        // 不允许把排课移动到其他课程
        if (!exist.getCourseId().equals(dto.getCourseId())) {
            throw new BizException("不支持变更排课所属课程");
        }
        if (dto.getStartTime().isBefore(java.time.LocalDateTime.now())) {
            throw new BizException("开播时间不能早于当前时间");
        }
        LiveSchedule schedule = BeanUtil.copyProperties(dto, LiveSchedule.class);
        schedule.setStatus(exist.getStatus());
        this.updateById(schedule);
    }

    @Override
    public void deleteSchedule(Long id) {
        LiveSchedule exist = this.getById(id);
        if (exist == null) {
            throw new BizException("排课不存在");
        }
        courseService.checkManageable(exist.getCourseId());
        if (exist.getStatus() != null && exist.getStatus() == 1) {
            throw new BizException("直播中的排课不可删除，请先结束直播");
        }
        this.removeById(id);
    }

    @Override
    public void checkRoomAccessible(Long scheduleId, LoginUser user) {
        LiveSchedule schedule = this.getById(scheduleId);
        if (schedule == null) {
            throw new BizException("排课不存在");
        }
        if ("ADMIN".equals(user.getRoleCode()) || "HEAD_TEACHER".equals(user.getRoleCode())) {
            return;
        }
        Course course = courseMapper.selectById(schedule.getCourseId());
        if (course == null) {
            throw new BizException("课程不存在");
        }
        if ("TEACHER".equals(user.getRoleCode())) {
            if (course.getTeacherId().equals(user.getUserId())) {
                return;
            }
            throw new BizException("无权进入该直播间");
        }
        // 学生：仅可进入上架课程的直播间
        if (course.getStatus() == null || course.getStatus() != 1) {
            throw new BizException("无权进入该直播间");
        }
    }

    private ScheduleVO toVO(LiveSchedule s, Map<Long, Course> courseMap, Map<Long, String> teacherNameMap) {
        ScheduleVO vo = BeanUtil.copyProperties(s, ScheduleVO.class);
        Course course = courseMap.get(s.getCourseId());
        if (course != null) {
            vo.setCourseName(course.getCourseName());
            vo.setTeacherName(teacherNameMap.get(course.getTeacherId()));
        }
        if (s.getStartTime() != null && s.getDuration() != null) {
            vo.setEndTime(s.getStartTime().plusMinutes(s.getDuration()));
        }
        return vo;
    }

    private Map<Long, Course> loadCourses(List<LiveSchedule> schedules) {
        List<Long> courseIds = schedules.stream().map(LiveSchedule::getCourseId).distinct().collect(Collectors.toList());
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
}
