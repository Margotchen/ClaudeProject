package com.edu.platform.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.ExamGradeDTO;
import com.edu.platform.dto.ExamQueryDTO;
import com.edu.platform.dto.ExamQuestionDTO;
import com.edu.platform.dto.ExamSaveDTO;
import com.edu.platform.dto.ExamSubmitDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.Exam;
import com.edu.platform.entity.ExamRecord;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.ExamMapper;
import com.edu.platform.mapper.ExamRecordMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.CourseService;
import com.edu.platform.service.ExamService;
import com.edu.platform.vo.ExamDetailVO;
import com.edu.platform.vo.ExamRecordVO;
import com.edu.platform.vo.ExamVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl extends ServiceImpl<ExamMapper, Exam> implements ExamService {

    /** 交卷时间校验宽限（秒）：容忍网络延迟 */
    private static final long SUBMIT_GRACE_SECONDS = 60;

    private final ExamRecordMapper recordMapper;
    private final CourseService courseService;
    private final CourseMapper courseMapper;
    private final SysUserMapper sysUserMapper;

    @Override
    public Page<ExamVO> pageExams(ExamQueryDTO query) {
        LoginUser current = SecurityUtils.getCurrentUser();
        List<Long> visibleCourseIds = resolveVisibleCourseIds(current);
        if (visibleCourseIds != null && visibleCourseIds.isEmpty()) {
            return new Page<>(query.getPageNum(), query.getPageSize(), 0);
        }
        Page<Exam> page = new Page<>(query.getPageNum(), query.getPageSize());
        LambdaQueryWrapper<Exam> wrapper = new LambdaQueryWrapper<Exam>()
                .in(visibleCourseIds != null, Exam::getCourseId, visibleCourseIds)
                .eq(query.getCourseId() != null, Exam::getCourseId, query.getCourseId())
                .like(StrUtil.isNotBlank(query.getKeyword()), Exam::getTitle, query.getKeyword())
                .orderByDesc(Exam::getCreateTime);
        Page<Exam> examPage = this.page(page, wrapper);

        List<Exam> records = examPage.getRecords();
        Map<Long, Course> courseMap = loadCourses(records);
        Map<Long, String> creatorNames = loadUserNames(
                records.stream().map(Exam::getCreatorId).collect(Collectors.toSet()));
        Map<Long, Long> recordCountMap = loadRecordCounts(records);
        Map<Long, ExamRecord> myLatestMap = "STUDENT".equals(current.getRoleCode())
                ? loadMyLatestRecords(records, current.getUserId()) : Collections.emptyMap();

        Page<ExamVO> result = new Page<>(examPage.getCurrent(), examPage.getSize(), examPage.getTotal());
        result.setRecords(records.stream().map(e -> {
            ExamVO vo = BeanUtil.copyProperties(e, ExamVO.class);
            Course course = courseMap.get(e.getCourseId());
            vo.setCourseName(course == null ? null : course.getCourseName());
            vo.setCreatorName(creatorNames.get(e.getCreatorId()));
            vo.setQuestionCount(parseQuestions(e.getQuestions()).size());
            vo.setRecordCount(recordCountMap.getOrDefault(e.getId(), 0L).intValue());
            ExamRecord my = myLatestMap.get(e.getId());
            if (my != null) {
                vo.setMyScore(my.getTotalScore());
                vo.setMyStatus(my.getStatus());
            }
            return vo;
        }).collect(Collectors.toList()));
        return result;
    }

    @Override
    public ExamDetailVO getDetail(Long id) {
        Exam exam = requireExam(id);
        checkVisible(exam);
        return toDetailVO(exam, isManager(exam));
    }

    @Override
    public void createExam(ExamSaveDTO dto) {
        courseService.checkManageable(dto.getCourseId());
        validateSave(dto);
        Exam exam = new Exam();
        exam.setCourseId(dto.getCourseId());
        exam.setTitle(dto.getTitle());
        exam.setQuestions(JSONUtil.toJsonStr(dto.getQuestions()));
        exam.setDuration(dto.getDuration());
        exam.setStartTime(dto.getStartTime());
        exam.setEndTime(dto.getEndTime());
        exam.setTotalScore(dto.getQuestions().stream().mapToInt(ExamQuestionDTO::getScore).sum());
        exam.setCreatorId(SecurityUtils.getCurrentUserId());
        this.save(exam);
    }

    @Override
    public void updateExam(ExamSaveDTO dto) {
        Exam exam = requireExam(dto.getId());
        courseService.checkManageable(exam.getCourseId());
        validateSave(dto);
        Exam update = new Exam();
        update.setId(exam.getId());
        update.setTitle(dto.getTitle());
        update.setQuestions(JSONUtil.toJsonStr(dto.getQuestions()));
        update.setDuration(dto.getDuration());
        update.setStartTime(dto.getStartTime());
        update.setEndTime(dto.getEndTime());
        update.setTotalScore(dto.getQuestions().stream().mapToInt(ExamQuestionDTO::getScore).sum());
        this.updateById(update);
    }

    @Override
    public void deleteExam(Long id) {
        Exam exam = requireExam(id);
        courseService.checkManageable(exam.getCourseId());
        this.removeById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ExamDetailVO startExam(Long id) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Exam exam = requireExam(id);
        checkStudentEnterable(exam);
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(exam.getStartTime())) {
            throw new BizException("考试尚未开始");
        }
        if (now.isAfter(exam.getEndTime())) {
            throw new BizException("考试已截止");
        }
        // 已有答题中记录则续答，否则新建
        ExamRecord record = recordMapper.selectOne(new LambdaQueryWrapper<ExamRecord>()
                .eq(ExamRecord::getExamId, id)
                .eq(ExamRecord::getStudentId, current.getUserId())
                .eq(ExamRecord::getStatus, 0)
                .orderByDesc(ExamRecord::getId)
                .last("LIMIT 1"));
        if (record == null) {
            record = new ExamRecord();
            record.setExamId(id);
            record.setStudentId(current.getUserId());
            record.setStatus(0);
            record.setStartTime(now);
            recordMapper.insert(record);
        }
        ExamDetailVO vo = toDetailVO(exam, false);
        vo.setRecordId(record.getId());
        vo.setRemainingSeconds(remainingSeconds(exam, record.getStartTime()));
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void submitExam(ExamSubmitDTO dto) {
        LoginUser current = SecurityUtils.getCurrentUser();
        ExamRecord record = requireRecord(dto.getRecordId());
        if (!record.getStudentId().equals(current.getUserId())) {
            throw new BizException("无权操作该答卷");
        }
        if (record.getStatus() == null || record.getStatus() != 0) {
            throw new BizException("该答卷已提交");
        }
        Exam exam = requireExam(record.getExamId());
        LocalDateTime now = LocalDateTime.now();
        if (remainingSeconds(exam, record.getStartTime()) + SUBMIT_GRACE_SECONDS < 0) {
            throw new BizException("已超出答题时限，无法交卷");
        }
        List<ExamQuestionDTO> questions = parseQuestions(exam.getQuestions());
        Map<Integer, String> answerMap = dto.getAnswers() == null ? Collections.emptyMap()
                : dto.getAnswers().stream().filter(a -> a.getIndex() != null)
                .collect(Collectors.toMap(ExamSubmitDTO.ExamAnswerDTO::getIndex,
                        a -> a.getAnswer() == null ? "" : a.getAnswer(), (a, b) -> b));
        // 客观题自动判分
        int objective = 0;
        boolean hasEssay = false;
        for (int i = 0; i < questions.size(); i++) {
            ExamQuestionDTO q = questions.get(i);
            if ("ESSAY".equals(q.getType())) {
                hasEssay = true;
                continue;
            }
            String answer = answerMap.get(i);
            if (answer != null && answer.trim().equalsIgnoreCase(q.getAnswer().trim())) {
                objective += q.getScore();
            }
        }
        record.setAnswers(JSONUtil.toJsonStr(dto.getAnswers()));
        record.setObjectiveScore(objective);
        record.setSubmitTime(now);
        if (hasEssay) {
            record.setStatus(1);
        } else {
            record.setSubjectiveScore(0);
            record.setTotalScore(objective);
            record.setStatus(2);
        }
        recordMapper.updateById(record);
    }

    @Override
    public Page<ExamRecordVO> pageRecords(Long examId, Integer pageNum, Integer pageSize) {
        Exam exam = requireExam(examId);
        courseService.checkManageable(exam.getCourseId());
        Page<ExamRecord> page = new Page<>(pageNum == null ? 1 : pageNum, pageSize == null ? 10 : pageSize);
        Page<ExamRecord> recordPage = recordMapper.selectPage(page,
                new LambdaQueryWrapper<ExamRecord>()
                        .eq(ExamRecord::getExamId, examId)
                        .orderByDesc(ExamRecord::getId));
        Map<Long, String> userNames = loadUserNames(recordPage.getRecords().stream()
                .flatMap(r -> java.util.stream.Stream.of(r.getStudentId(), r.getGraderId()))
                .filter(java.util.Objects::nonNull).collect(Collectors.toSet()));
        Page<ExamRecordVO> result = new Page<>(recordPage.getCurrent(), recordPage.getSize(), recordPage.getTotal());
        result.setRecords(recordPage.getRecords().stream()
                .map(r -> toRecordVO(r, exam.getTitle(), userNames)).collect(Collectors.toList()));
        return result;
    }

    @Override
    public ExamRecordVO getRecordDetail(Long recordId) {
        ExamRecord record = requireRecord(recordId);
        Exam exam = requireExam(record.getExamId());
        LoginUser current = SecurityUtils.getCurrentUser();
        boolean manager = isManager(exam);
        // 学生只能看自己的答卷
        if (!manager && !record.getStudentId().equals(current.getUserId())) {
            throw new BizException("无权查看该答卷");
        }
        Map<Long, String> userNames = loadUserNames(
                java.util.stream.Stream.of(record.getStudentId(), record.getGraderId())
                        .filter(java.util.Objects::nonNull).collect(Collectors.toSet()));
        ExamRecordVO vo = toRecordVO(record, exam.getTitle(), userNames);
        // 学生视角不暴露客观题正确答案（主观题无标准答案）
        List<ExamQuestionDTO> questions = parseQuestions(exam.getQuestions());
        if (!manager) {
            questions.forEach(q -> q.setAnswer(null));
        }
        vo.setQuestions(questions);
        if (StrUtil.isNotBlank(record.getAnswers())) {
            vo.setMyAnswers(JSONUtil.toList(record.getAnswers(), ExamSubmitDTO.ExamAnswerDTO.class));
        }
        return vo;
    }

    @Override
    public List<ExamRecordVO> myRecords(Long examId) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Exam exam = requireExam(examId);
        List<ExamRecord> records = recordMapper.selectList(new LambdaQueryWrapper<ExamRecord>()
                .eq(ExamRecord::getExamId, examId)
                .eq(ExamRecord::getStudentId, current.getUserId())
                .orderByDesc(ExamRecord::getId));
        return records.stream()
                .map(r -> toRecordVO(r, exam.getTitle(), Collections.emptyMap()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void grade(ExamGradeDTO dto) {
        ExamRecord record = requireRecord(dto.getRecordId());
        Exam exam = requireExam(record.getExamId());
        courseService.checkManageable(exam.getCourseId());
        if (record.getStatus() == null || record.getStatus() == 0) {
            throw new BizException("学生尚未交卷");
        }
        List<ExamQuestionDTO> questions = parseQuestions(exam.getQuestions());
        int subjective = 0;
        for (ExamGradeDTO.EssayScoreDTO es : dto.getEssayScores() == null
                ? List.<ExamGradeDTO.EssayScoreDTO>of() : dto.getEssayScores()) {
            if (es.getIndex() == null || es.getIndex() < 0 || es.getIndex() >= questions.size()) {
                throw new BizException("题目下标非法：" + es.getIndex());
            }
            ExamQuestionDTO q = questions.get(es.getIndex());
            if (!"ESSAY".equals(q.getType())) {
                throw new BizException("第 " + (es.getIndex() + 1) + " 题不是简答题");
            }
            if (es.getScore() == null || es.getScore() < 0 || es.getScore() > q.getScore()) {
                throw new BizException("第 " + (es.getIndex() + 1) + " 题得分须在 0~" + q.getScore() + " 之间");
            }
            subjective += es.getScore();
        }
        int objective = record.getObjectiveScore() == null ? 0 : record.getObjectiveScore();
        record.setSubjectiveScore(subjective);
        record.setTotalScore(objective + subjective);
        record.setComment(dto.getComment());
        record.setGraderId(SecurityUtils.getCurrentUserId());
        record.setGradeTime(LocalDateTime.now());
        record.setStatus(2);
        recordMapper.updateById(record);
    }

    // ========== 内部方法 ==========

    private void validateSave(ExamSaveDTO dto) {
        if (StrUtil.isBlank(dto.getTitle())) {
            throw new BizException("考试标题不能为空");
        }
        if (dto.getQuestions() == null || dto.getQuestions().isEmpty()) {
            throw new BizException("至少需要一道题目");
        }
        for (ExamQuestionDTO q : dto.getQuestions()) {
            if (!List.of("CHOICE", "JUDGE", "ESSAY").contains(q.getType())) {
                throw new BizException("不支持的题型：" + q.getType());
            }
            if (StrUtil.isBlank(q.getStem())) {
                throw new BizException("题干不能为空");
            }
            if (q.getScore() == null || q.getScore() <= 0) {
                throw new BizException("题目分值须大于0");
            }
            if ("CHOICE".equals(q.getType())) {
                if (q.getOptions() == null || q.getOptions().size() < 2) {
                    throw new BizException("选择题至少需要两个选项");
                }
                if (StrUtil.isBlank(q.getAnswer())) {
                    throw new BizException("选择题须设置正确答案");
                }
            }
            if ("JUDGE".equals(q.getType()) && !List.of("true", "false").contains(
                    q.getAnswer() == null ? "" : q.getAnswer().toLowerCase())) {
                throw new BizException("判断题正确答案须为 true/false");
            }
        }
        if (dto.getDuration() == null || dto.getDuration() <= 0) {
            throw new BizException("答题时长须大于0分钟");
        }
        if (dto.getStartTime() == null || dto.getEndTime() == null || !dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new BizException("考试截止时间须晚于开始时间");
        }
    }

    /** 剩余答题秒数：min(时长相减, 距截止) */
    private long remainingSeconds(Exam exam, LocalDateTime recordStart) {
        LocalDateTime now = LocalDateTime.now();
        long byDuration = Duration.between(now, recordStart.plusMinutes(exam.getDuration())).getSeconds();
        long byDeadline = Duration.between(now, exam.getEndTime()).getSeconds();
        return Math.min(byDuration, byDeadline);
    }

    private void checkStudentEnterable(Exam exam) {
        Course course = courseService.getById(exam.getCourseId());
        if (course == null || course.getStatus() == null || course.getStatus() != 1) {
            throw new BizException("课程已下架，无法进入考试");
        }
    }

    /** 列表/详情的可见性：学生仅上架课程，讲师仅自己课程 */
    private void checkVisible(Exam exam) {
        LoginUser current = SecurityUtils.getCurrentUser();
        if ("ADMIN".equals(current.getRoleCode()) || "HEAD_TEACHER".equals(current.getRoleCode())) {
            return;
        }
        Course course = courseService.getById(exam.getCourseId());
        if (course == null) {
            throw new BizException("课程不存在");
        }
        if ("TEACHER".equals(current.getRoleCode()) && course.getTeacherId().equals(current.getUserId())) {
            return;
        }
        if ("STUDENT".equals(current.getRoleCode()) && course.getStatus() != null && course.getStatus() == 1) {
            return;
        }
        throw new BizException("无权查看该考试");
    }

    /** 当前用户是否为该考试的管理者（管理员或课程讲师） */
    private boolean isManager(Exam exam) {
        LoginUser current = SecurityUtils.getCurrentUser();
        if ("ADMIN".equals(current.getRoleCode())) {
            return true;
        }
        if (!"TEACHER".equals(current.getRoleCode())) {
            return false;
        }
        Course course = courseService.getById(exam.getCourseId());
        return course != null && course.getTeacherId().equals(current.getUserId());
    }

    private Exam requireExam(Long id) {
        Exam exam = this.getById(id);
        if (exam == null) {
            throw new BizException("考试不存在");
        }
        return exam;
    }

    private ExamRecord requireRecord(Long id) {
        ExamRecord record = recordMapper.selectById(id);
        if (record == null) {
            throw new BizException("答卷不存在");
        }
        return record;
    }

    private List<ExamQuestionDTO> parseQuestions(String json) {
        if (StrUtil.isBlank(json)) {
            return Collections.emptyList();
        }
        return JSONUtil.toList(json, ExamQuestionDTO.class);
    }

    private ExamDetailVO toDetailVO(Exam exam, boolean withAnswer) {
        // questions 字段 String→List 需忽略，单独解析
        ExamDetailVO vo = BeanUtil.copyProperties(exam, ExamDetailVO.class, "questions");
        List<ExamQuestionDTO> questions = parseQuestions(exam.getQuestions());
        if (!withAnswer) {
            // 学生视角剥离正确答案
            questions.forEach(q -> q.setAnswer(null));
        }
        vo.setQuestions(questions);
        return vo;
    }

    private ExamRecordVO toRecordVO(ExamRecord r, String examTitle, Map<Long, String> userNames) {
        ExamRecordVO vo = BeanUtil.copyProperties(r, ExamRecordVO.class);
        vo.setExamTitle(examTitle);
        vo.setStudentName(userNames.get(r.getStudentId()));
        vo.setGraderName(r.getGraderId() == null ? null : userNames.get(r.getGraderId()));
        return vo;
    }

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

    private Map<Long, Course> loadCourses(List<Exam> records) {
        List<Long> courseIds = records.stream().map(Exam::getCourseId).distinct().collect(Collectors.toList());
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

    private Map<Long, Long> loadRecordCounts(List<Exam> records) {
        if (records.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> examIds = records.stream().map(Exam::getId).collect(Collectors.toList());
        return recordMapper.selectList(new LambdaQueryWrapper<ExamRecord>()
                        .in(ExamRecord::getExamId, examIds))
                .stream().collect(Collectors.groupingBy(ExamRecord::getExamId, Collectors.counting()));
    }

    /** 学生各考试最近一次答卷 */
    private Map<Long, ExamRecord> loadMyLatestRecords(List<Exam> records, Long studentId) {
        if (records.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> examIds = records.stream().map(Exam::getId).collect(Collectors.toList());
        return recordMapper.selectList(new LambdaQueryWrapper<ExamRecord>()
                        .in(ExamRecord::getExamId, examIds)
                        .eq(ExamRecord::getStudentId, studentId)
                        .orderByDesc(ExamRecord::getId))
                .stream().collect(Collectors.toMap(ExamRecord::getExamId, Function.identity(), (a, b) -> a));
    }
}
