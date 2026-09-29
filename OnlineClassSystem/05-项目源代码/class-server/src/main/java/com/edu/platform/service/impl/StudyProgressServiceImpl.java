package com.edu.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.dto.HeartbeatDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.Exam;
import com.edu.platform.entity.ExamRecord;
import com.edu.platform.entity.Homework;
import com.edu.platform.entity.HomeworkSubmission;
import com.edu.platform.entity.StudyProgress;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.ExamMapper;
import com.edu.platform.mapper.ExamRecordMapper;
import com.edu.platform.mapper.HomeworkMapper;
import com.edu.platform.mapper.HomeworkSubmissionMapper;
import com.edu.platform.mapper.StudyProgressMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.StudyProgressService;
import com.edu.platform.vo.MyProgressVO;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyProgressServiceImpl extends ServiceImpl<StudyProgressMapper, StudyProgress> implements StudyProgressService {

    /** 单次心跳秒数上限（防作弊） */
    private static final int MAX_HEARTBEAT_SECONDS = 60;

    private final CourseMapper courseMapper;
    private final HomeworkMapper homeworkMapper;
    private final HomeworkSubmissionMapper submissionMapper;
    private final ExamMapper examMapper;
    private final ExamRecordMapper recordMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void heartbeat(HeartbeatDTO dto) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Course course = courseMapper.selectById(dto.getCourseId());
        if (course == null || course.getStatus() == null || course.getStatus() != 1) {
            throw new BizException("课程不存在或已下架");
        }
        if (!List.of("LIVE", "PLAYBACK").contains(dto.getScene())) {
            throw new BizException("非法的上报场景");
        }
        // 钳制秒数，防篡改放大
        int seconds = Math.max(1, Math.min(dto.getSeconds() == null ? 0 : dto.getSeconds(), MAX_HEARTBEAT_SECONDS));
        try {
            upsertProgress(current.getUserId(), dto.getCourseId(), dto.getScene(), seconds);
        } catch (DuplicateKeyException e) {
            // 并发插入同一 (student, course)：退化为累加更新
            upsertProgress(current.getUserId(), dto.getCourseId(), dto.getScene(), seconds);
        }
    }

    private void upsertProgress(Long studentId, Long courseId, String scene, int seconds) {
        int updated = this.getBaseMapper().update(null, new LambdaUpdateWrapper<StudyProgress>()
                .eq(StudyProgress::getStudentId, studentId)
                .eq(StudyProgress::getCourseId, courseId)
                .setSql("live_seconds = live_seconds + " + ("LIVE".equals(scene) ? seconds : 0))
                .setSql("playback_seconds = playback_seconds + " + ("PLAYBACK".equals(scene) ? seconds : 0))
                .set(StudyProgress::getLastStudyTime, LocalDateTime.now()));
        if (updated == 0) {
            StudyProgress progress = new StudyProgress();
            progress.setStudentId(studentId);
            progress.setCourseId(courseId);
            progress.setLiveSeconds("LIVE".equals(scene) ? seconds : 0);
            progress.setPlaybackSeconds("PLAYBACK".equals(scene) ? seconds : 0);
            progress.setLastStudyTime(LocalDateTime.now());
            this.save(progress);
        }
    }

    @Override
    public MyProgressVO myProgress() {
        LoginUser current = SecurityUtils.getCurrentUser();
        Long studentId = current.getUserId();

        // 学生可见范围 = 全部上架课程
        List<Course> courses = courseMapper.selectList(new LambdaQueryWrapper<Course>().eq(Course::getStatus, 1));
        List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

        Map<Long, StudyProgress> progressMap = courseIds.isEmpty() ? Map.of()
                : this.list(new LambdaQueryWrapper<StudyProgress>()
                        .eq(StudyProgress::getStudentId, studentId)
                        .in(StudyProgress::getCourseId, courseIds))
                .stream().collect(Collectors.toMap(StudyProgress::getCourseId, Function.identity()));

        List<Homework> homeworkList = courseIds.isEmpty() ? List.of()
                : homeworkMapper.selectList(new LambdaQueryWrapper<Homework>().in(Homework::getCourseId, courseIds));
        Map<Long, Long> homeworkTotalMap = countByCourse(homeworkList, Homework::getCourseId);
        Map<Long, Long> homeworkCourseMap = homeworkList.stream()
                .collect(Collectors.toMap(Homework::getId, Homework::getCourseId));
        Map<Long, Long> mySubmittedMap = courseIds.isEmpty() ? Map.of()
                : submissionMapper.selectList(new LambdaQueryWrapper<HomeworkSubmission>()
                        .eq(HomeworkSubmission::getStudentId, studentId))
                .stream().filter(s -> homeworkCourseMap.containsKey(s.getHomeworkId()))
                .collect(Collectors.groupingBy(s -> homeworkCourseMap.get(s.getHomeworkId()),
                        Collectors.counting()));
        // 考试平均分（按课程）
        List<Exam> exams = courseIds.isEmpty() ? List.of()
                : examMapper.selectList(new LambdaQueryWrapper<Exam>().in(Exam::getCourseId, courseIds));
        Map<Long, Long> examCourseMap = exams.stream()
                .collect(Collectors.toMap(Exam::getId, Exam::getCourseId));
        Map<Long, List<Integer>> examScoreMap = exams.isEmpty() ? Map.of()
                : recordMapper.selectList(new LambdaQueryWrapper<ExamRecord>()
                        .eq(ExamRecord::getStudentId, studentId)
                        .eq(ExamRecord::getStatus, 2)
                        .in(ExamRecord::getExamId, examCourseMap.keySet()))
                .stream().filter(r -> r.getTotalScore() != null)
                .collect(Collectors.groupingBy(r -> examCourseMap.get(r.getExamId()),
                        Collectors.mapping(ExamRecord::getTotalScore, Collectors.toList())));

        MyProgressVO vo = new MyProgressVO();
        List<MyProgressVO.CourseProgress> courseList = courses.stream().map(c -> {
            MyProgressVO.CourseProgress cp = new MyProgressVO.CourseProgress();
            cp.setCourseId(c.getId());
            cp.setCourseName(c.getCourseName());
            StudyProgress p = progressMap.get(c.getId());
            cp.setLiveSeconds(p == null ? 0 : p.getLiveSeconds());
            cp.setPlaybackSeconds(p == null ? 0 : p.getPlaybackSeconds());
            cp.setLastStudyTime(p == null ? null : p.getLastStudyTime());
            cp.setHomeworkTotal(homeworkTotalMap.getOrDefault(c.getId(), 0L).intValue());
            cp.setHomeworkSubmitted(mySubmittedMap.getOrDefault(c.getId(), 0L).intValue());
            List<Integer> scores = examScoreMap.get(c.getId());
            cp.setExamAvg(scores == null || scores.isEmpty() ? null
                    : (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0)));
            return cp;
        }).collect(Collectors.toList());
        vo.setCourses(courseList);

        int totalSeconds = courseList.stream()
                .mapToInt(c -> c.getLiveSeconds() + c.getPlaybackSeconds()).sum();
        int hwTotal = courseList.stream().mapToInt(MyProgressVO.CourseProgress::getHomeworkTotal).sum();
        int hwSubmitted = courseList.stream().mapToInt(MyProgressVO.CourseProgress::getHomeworkSubmitted).sum();
        vo.setTotalSeconds(totalSeconds);
        vo.setHomeworkRate(hwTotal == 0 ? 0 : (int) Math.round(hwSubmitted * 100.0 / hwTotal));
        List<Integer> allScores = examScoreMap.values().stream().flatMap(List::stream).collect(Collectors.toList());
        vo.setExamAvg(allScores.isEmpty() ? null
                : (int) Math.round(allScores.stream().mapToInt(Integer::intValue).average().orElse(0)));
        return vo;
    }

    private <T> Map<Long, Long> countByCourse(List<T> list, Function<T, Long> courseIdGetter) {
        return list.stream().collect(Collectors.groupingBy(courseIdGetter, Collectors.counting()));
    }
}
