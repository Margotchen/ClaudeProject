package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.CourseQueryDTO;
import com.edu.platform.dto.CourseSaveDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.LiveSchedule;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.LiveScheduleMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.vo.CourseVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl extends ServiceImpl<CourseMapper, Course> implements CourseService {

    private final SysUserMapper sysUserMapper;
    private final LiveScheduleMapper liveScheduleMapper;

    @Override
    public Page<CourseVO> pageCourses(CourseQueryDTO query) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Page<Course> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<Course> wrapper = new LambdaQueryWrapper<Course>()
                .like(StrUtil.isNotBlank(query.getKeyword()), Course::getCourseName, query.getKeyword())
                .eq(query.getStatus() != null, Course::getStatus, query.getStatus())
                // 讲师只能看到自己的课程；学生只能看到上架课程
                .eq("TEACHER".equals(current.getRoleCode()), Course::getTeacherId, current.getUserId())
                .eq("STUDENT".equals(current.getRoleCode()), Course::getStatus, 1)
                .orderByDesc(Course::getCreateTime);
        Page<Course> coursePage = this.page(page, wrapper);

        List<Course> records = coursePage.getRecords();
        Map<Long, String> teacherNameMap = loadTeacherNames(records);
        Map<Long, Long> scheduleCountMap = loadScheduleCounts(records);

        Page<CourseVO> result = new Page<>(coursePage.getCurrent(), coursePage.getSize(), coursePage.getTotal());
        result.setRecords(records.stream().map(course -> {
            CourseVO vo = BeanUtil.copyProperties(course, CourseVO.class);
            vo.setTeacherName(teacherNameMap.get(course.getTeacherId()));
            vo.setScheduleCount(scheduleCountMap.getOrDefault(course.getId(), 0L));
            return vo;
        }).collect(Collectors.toList()));
        return result;
    }

    @Override
    public void createCourse(CourseSaveDTO dto) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Course course = BeanUtil.copyProperties(dto, Course.class);
        course.setId(null);
        if ("TEACHER".equals(current.getRoleCode())) {
            // 讲师创建的课程固定归属自己
            course.setTeacherId(current.getUserId());
        } else {
            // 管理员必须指定有效讲师
            if (dto.getTeacherId() == null) {
                throw new BizException("请选择授课讲师");
            }
            checkTeacher(dto.getTeacherId());
            course.setTeacherId(dto.getTeacherId());
        }
        course.setStatus(1);
        this.save(course);
    }

    @Override
    public void updateCourse(CourseSaveDTO dto) {
        if (dto.getId() == null) {
            throw new BizException("课程ID不能为空");
        }
        Course exist = checkManageable(dto.getId());
        Course course = BeanUtil.copyProperties(dto, Course.class);
        // 讲师不可变更课程归属；管理员可调整授课讲师
        LoginUser current = SecurityUtils.getCurrentUser();
        if ("TEACHER".equals(current.getRoleCode()) || dto.getTeacherId() == null) {
            course.setTeacherId(exist.getTeacherId());
        } else {
            checkTeacher(dto.getTeacherId());
        }
        course.setStatus(exist.getStatus());
        this.updateById(course);
    }

    @Override
    public void deleteCourse(Long id) {
        checkManageable(id);
        this.removeById(id);
        // 级联删除该课程下的排课
        liveScheduleMapper.delete(new LambdaQueryWrapper<LiveSchedule>()
                .eq(LiveSchedule::getCourseId, id));
    }

    @Override
    public void updateStatus(Long id, Integer status) {
        checkManageable(id);
        Course course = new Course();
        course.setId(id);
        course.setStatus(status);
        this.updateById(course);
    }

    @Override
    public Course checkManageable(Long courseId) {
        Course course = this.getById(courseId);
        if (course == null) {
            throw new BizException("课程不存在");
        }
        LoginUser current = SecurityUtils.getCurrentUser();
        if ("ADMIN".equals(current.getRoleCode())) {
            return course;
        }
        if ("TEACHER".equals(current.getRoleCode()) && course.getTeacherId().equals(current.getUserId())) {
            return course;
        }
        throw new BizException("无权操作该课程");
    }

    private void checkTeacher(Long teacherId) {
        SysUser teacher = sysUserMapper.selectById(teacherId);
        if (teacher == null) {
            throw new BizException("讲师不存在");
        }
        String roleCode = sysUserMapper.selectRoleCodeByUserId(teacherId);
        if (!"TEACHER".equals(roleCode)) {
            throw new BizException("所选用户不是讲师角色");
        }
    }

    private Map<Long, String> loadTeacherNames(List<Course> courses) {
        List<Long> teacherIds = courses.stream().map(Course::getTeacherId).distinct().collect(Collectors.toList());
        if (teacherIds.isEmpty()) {
            return Map.of();
        }
        return sysUserMapper.selectBatchIds(teacherIds).stream()
                .collect(Collectors.toMap(SysUser::getId, SysUser::getRealName));
    }

    private Map<Long, Long> loadScheduleCounts(List<Course> courses) {
        List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());
        if (courseIds.isEmpty()) {
            return Map.of();
        }
        // 逐课统计场次（数据量小，避免手写 group by XML）
        return courseIds.stream().collect(Collectors.toMap(Function.identity(), id ->
                liveScheduleMapper.selectCount(new LambdaQueryWrapper<LiveSchedule>()
                        .eq(LiveSchedule::getCourseId, id))));
    }
}
