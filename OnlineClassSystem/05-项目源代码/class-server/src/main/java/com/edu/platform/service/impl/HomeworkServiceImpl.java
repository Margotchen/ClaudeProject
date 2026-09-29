package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.HomeworkGradeDTO;
import com.edu.platform.dto.HomeworkQueryDTO;
import com.edu.platform.dto.HomeworkSaveDTO;
import com.edu.platform.dto.HomeworkSubmitDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.Homework;
import com.edu.platform.entity.HomeworkSubmission;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.HomeworkMapper;
import com.edu.platform.mapper.HomeworkSubmissionMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.service.HomeworkService;
import com.edu.platform.vo.HomeworkSubmissionVO;
import com.edu.platform.vo.HomeworkVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HomeworkServiceImpl extends ServiceImpl<HomeworkMapper, Homework> implements HomeworkService {

    private final HomeworkSubmissionMapper submissionMapper;
    private final CourseService courseService;
    private final CourseMapper courseMapper;
    private final SysUserMapper sysUserMapper;

    @Override
    public Page<HomeworkVO> pageHomework(HomeworkQueryDTO query) {
        LoginUser current = SecurityUtils.getCurrentUser();
        // 角色数据范围前置到 SQL：学生仅上架课程、讲师仅自己课程
        List<Long> visibleCourseIds = resolveVisibleCourseIds(current);
        if (visibleCourseIds != null && visibleCourseIds.isEmpty()) {
            return new Page<>(query.getPageNum(), query.getPageSize(), 0);
        }
        Page<Homework> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<Homework> wrapper = new LambdaQueryWrapper<Homework>()
                .in(visibleCourseIds != null, Homework::getCourseId, visibleCourseIds)
                .eq(query.getCourseId() != null, Homework::getCourseId, query.getCourseId())
                .like(StrUtil.isNotBlank(query.getKeyword()), Homework::getTitle, query.getKeyword())
                .orderByDesc(Homework::getCreateTime);
        Page<Homework> hwPage = this.page(page, wrapper);

        List<Homework> records = hwPage.getRecords();
        Map<Long, Course> courseMap = loadCourses(records);
        Map<Long, String> creatorNames = loadUserNames(
                records.stream().map(Homework::getCreatorId).collect(Collectors.toSet()));
        // 批量统计提交数/已批改数；学生视角查自己的提交
        Map<Long, long[]> statsMap = loadSubmissionStats(records);
        Map<Long, HomeworkSubmission> myMap = "STUDENT".equals(current.getRoleCode())
                ? loadMySubmissions(records, current.getUserId()) : Collections.emptyMap();

        Page<HomeworkVO> result = new Page<>(hwPage.getCurrent(), hwPage.getSize(), hwPage.getTotal());
        result.setRecords(records.stream().map(h -> {
            HomeworkVO vo = BeanUtil.copyProperties(h, HomeworkVO.class);
            Course course = courseMap.get(h.getCourseId());
            vo.setCourseName(course == null ? null : course.getCourseName());
            vo.setCreatorName(creatorNames.get(h.getCreatorId()));
            long[] stats = statsMap.getOrDefault(h.getId(), new long[]{0, 0});
            vo.setSubmissionCount((int) stats[0]);
            vo.setGradedCount((int) stats[1]);
            HomeworkSubmission my = myMap.get(h.getId());
            if (my != null) {
                vo.setMyStatus(my.getStatus());
                vo.setMyScore(my.getScore());
            }
            return vo;
        }).collect(Collectors.toList()));
        return result;
    }

    @Override
    public void createHomework(HomeworkSaveDTO dto) {
        courseService.checkManageable(dto.getCourseId());
        validateSave(dto);
        Homework homework = BeanUtil.copyProperties(dto, Homework.class);
        homework.setId(null);
        homework.setCreatorId(SecurityUtils.getCurrentUserId());
        this.save(homework);
    }

    @Override
    public void updateHomework(HomeworkSaveDTO dto) {
        Homework homework = requireHomework(dto.getId());
        courseService.checkManageable(homework.getCourseId());
        validateSave(dto);
        Homework update = BeanUtil.copyProperties(dto, Homework.class);
        update.setCourseId(null); // 不允许变更所属课程
        this.updateById(update);
    }

    @Override
    public void deleteHomework(Long id) {
        Homework homework = requireHomework(id);
        courseService.checkManageable(homework.getCourseId());
        this.removeById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submit(HomeworkSubmitDTO dto) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Homework homework = requireHomework(dto.getHomeworkId());
        Course course = courseService.getById(homework.getCourseId());
        if (course == null || course.getStatus() == null || course.getStatus() != 1) {
            throw new BizException("课程已下架，无法提交作业");
        }
        if (LocalDateTime.now().isAfter(homework.getDeadline())) {
            throw new BizException("已过截止时间，无法提交");
        }
        // 一人一份（uk_hw_student 兜底）：重复提交=覆盖内容并重置为待批改
        // 用 UpdateWrapper 显式 set，保证附件等字段可被清空（updateById 忽略 null）
        HomeworkSubmission existing = submissionMapper.selectOne(new LambdaQueryWrapper<HomeworkSubmission>()
                .eq(HomeworkSubmission::getHomeworkId, dto.getHomeworkId())
                .eq(HomeworkSubmission::getStudentId, current.getUserId()));
        if (existing != null) {
            submissionMapper.update(null, new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<HomeworkSubmission>()
                    .eq(HomeworkSubmission::getId, existing.getId())
                    .set(HomeworkSubmission::getContent, dto.getContent())
                    .set(HomeworkSubmission::getAttachmentName, dto.getAttachmentName())
                    .set(HomeworkSubmission::getAttachmentPath, dto.getAttachmentPath())
                    .set(HomeworkSubmission::getSubmitTime, LocalDateTime.now())
                    .set(HomeworkSubmission::getStatus, 0)
                    .set(HomeworkSubmission::getScore, null)
                    .set(HomeworkSubmission::getComment, null)
                    .set(HomeworkSubmission::getGraderId, null)
                    .set(HomeworkSubmission::getGradeTime, null));
            return;
        }
        HomeworkSubmission submission = BeanUtil.copyProperties(dto, HomeworkSubmission.class);
        submission.setId(null);
        submission.setStudentId(current.getUserId());
        submission.setSubmitTime(LocalDateTime.now());
        submission.setStatus(0);
        submissionMapper.insert(submission);
    }

    @Override
    public Page<HomeworkSubmissionVO> pageSubmissions(Long homeworkId, Integer pageNum, Integer pageSize) {
        Homework homework = requireHomework(homeworkId);
        courseService.checkManageable(homework.getCourseId());
        Page<HomeworkSubmission> page = new Page<>(pageNum == null ? 1 : pageNum, pageSize == null ? 10 : pageSize);
        Page<HomeworkSubmission> subPage = submissionMapper.selectPage(page,
                new LambdaQueryWrapper<HomeworkSubmission>()
                        .eq(HomeworkSubmission::getHomeworkId, homeworkId)
                        .orderByDesc(HomeworkSubmission::getSubmitTime));
        Map<Long, String> userNames = loadUserNames(
                subPage.getRecords().stream()
                        .flatMap(s -> java.util.stream.Stream.of(s.getStudentId(), s.getGraderId()))
                        .filter(java.util.Objects::nonNull).collect(Collectors.toSet()));
        Page<HomeworkSubmissionVO> result = new Page<>(subPage.getCurrent(), subPage.getSize(), subPage.getTotal());
        result.setRecords(subPage.getRecords().stream()
                .map(s -> toSubmissionVO(s, userNames)).collect(Collectors.toList()));
        return result;
    }

    @Override
    public HomeworkSubmissionVO mySubmission(Long homeworkId) {
        LoginUser current = SecurityUtils.getCurrentUser();
        HomeworkSubmission submission = submissionMapper.selectOne(new LambdaQueryWrapper<HomeworkSubmission>()
                .eq(HomeworkSubmission::getHomeworkId, homeworkId)
                .eq(HomeworkSubmission::getStudentId, current.getUserId()));
        if (submission == null) {
            return null;
        }
        Map<Long, String> userNames = loadUserNames(
                java.util.stream.Stream.of(submission.getStudentId(), submission.getGraderId())
                        .filter(java.util.Objects::nonNull).collect(Collectors.toSet()));
        return toSubmissionVO(submission, userNames);
    }

    @Override
    public void grade(HomeworkGradeDTO dto) {
        HomeworkSubmission submission = submissionMapper.selectById(dto.getSubmissionId());
        if (submission == null) {
            throw new BizException("提交记录不存在");
        }
        Homework homework = requireHomework(submission.getHomeworkId());
        courseService.checkManageable(homework.getCourseId());
        if (dto.getScore() == null || dto.getScore() < 0 || dto.getScore() > 100) {
            throw new BizException("分数须在 0~100 之间");
        }
        HomeworkSubmission update = new HomeworkSubmission();
        update.setId(submission.getId());
        update.setScore(dto.getScore());
        update.setComment(dto.getComment());
        update.setGraderId(SecurityUtils.getCurrentUserId());
        update.setGradeTime(LocalDateTime.now());
        update.setStatus(1);
        submissionMapper.updateById(update);
    }

    private void validateSave(HomeworkSaveDTO dto) {
        if (StrUtil.isBlank(dto.getTitle())) {
            throw new BizException("作业标题不能为空");
        }
        if (dto.getDeadline() == null) {
            throw new BizException("截止时间不能为空");
        }
        if (dto.getDeadline().isBefore(LocalDateTime.now())) {
            throw new BizException("截止时间不能早于当前时间");
        }
    }

    private Homework requireHomework(Long id) {
        Homework homework = this.getById(id);
        if (homework == null) {
            throw new BizException("作业不存在");
        }
        return homework;
    }

    private HomeworkSubmissionVO toSubmissionVO(HomeworkSubmission s, Map<Long, String> userNames) {
        HomeworkSubmissionVO vo = BeanUtil.copyProperties(s, HomeworkSubmissionVO.class);
        vo.setStudentName(userNames.get(s.getStudentId()));
        vo.setGraderName(s.getGraderId() == null ? null : userNames.get(s.getGraderId()));
        return vo;
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

    private Map<Long, Course> loadCourses(List<Homework> records) {
        List<Long> courseIds = records.stream().map(Homework::getCourseId).distinct().collect(Collectors.toList());
        if (courseIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return courseMapper.selectBatchIds(courseIds).stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));
    }

    private Map<Long, String> loadUserNames(java.util.Collection<Long> userIds) {
        List<Long> ids = userIds.stream().filter(java.util.Objects::nonNull).distinct().collect(Collectors.toList());
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        return sysUserMapper.selectBatchIds(ids).stream()
                .collect(Collectors.toMap(SysUser::getId, SysUser::getRealName, (a, b) -> a));
    }

    /** 批量统计各作业的 [提交总数, 已批改数] */
    private Map<Long, long[]> loadSubmissionStats(List<Homework> records) {
        if (records.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> hwIds = records.stream().map(Homework::getId).collect(Collectors.toList());
        List<HomeworkSubmission> subs = submissionMapper.selectList(new LambdaQueryWrapper<HomeworkSubmission>()
                .in(HomeworkSubmission::getHomeworkId, hwIds));
        return subs.stream().collect(Collectors.groupingBy(HomeworkSubmission::getHomeworkId,
                Collectors.collectingAndThen(Collectors.toList(), list -> new long[]{
                        list.size(), list.stream().filter(s -> s.getStatus() != null && s.getStatus() == 1).count()})));
    }

    private Map<Long, HomeworkSubmission> loadMySubmissions(List<Homework> records, Long studentId) {
        if (records.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> hwIds = records.stream().map(Homework::getId).collect(Collectors.toList());
        return submissionMapper.selectList(new LambdaQueryWrapper<HomeworkSubmission>()
                        .in(HomeworkSubmission::getHomeworkId, hwIds)
                        .eq(HomeworkSubmission::getStudentId, studentId))
                .stream().collect(Collectors.toMap(HomeworkSubmission::getHomeworkId, Function.identity()));
    }
}
