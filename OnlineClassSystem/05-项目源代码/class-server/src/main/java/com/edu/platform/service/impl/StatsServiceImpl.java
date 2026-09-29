package com.edu.platform.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.edu.platform.common.BizException;
import com.edu.platform.common.SecurityUtils;
import com.edu.platform.entity.Course;
import com.edu.platform.entity.Exam;
import com.edu.platform.entity.ExamRecord;
import com.edu.platform.entity.Homework;
import com.edu.platform.entity.HomeworkSubmission;
import com.edu.platform.entity.StudyProgress;
import com.edu.platform.entity.SysUser;
import com.edu.platform.mapper.CourseMapper;
import com.edu.platform.mapper.ExamMapper;
import com.edu.platform.mapper.ExamRecordMapper;
import com.edu.platform.mapper.HomeworkMapper;
import com.edu.platform.mapper.HomeworkSubmissionMapper;
import com.edu.platform.mapper.StudyProgressMapper;
import com.edu.platform.mapper.SysUserMapper;
import com.edu.platform.security.LoginUser;
import com.edu.platform.service.StatsService;
import com.edu.platform.vo.CourseStatsVO;
import com.edu.platform.vo.ScoreDistributionVO;
import com.edu.platform.vo.StatsOverviewVO;
import com.edu.platform.vo.StudentStatsVO;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 学习统计分析服务实现（实时聚合，数据范围按角色过滤）
 */
@Service
@RequiredArgsConstructor
public class StatsServiceImpl implements StatsService {

    private final CourseMapper courseMapper;
    private final StudyProgressMapper progressMapper;
    private final HomeworkMapper homeworkMapper;
    private final HomeworkSubmissionMapper submissionMapper;
    private final ExamMapper examMapper;
    private final ExamRecordMapper recordMapper;
    private final SysUserMapper userMapper;

    @Override
    public StatsOverviewVO overview() {
        LoginUser current = SecurityUtils.getCurrentUser();
        StatsContext ctx = loadContext(current);

        StatsOverviewVO vo = new StatsOverviewVO();
        vo.setCourseCount(ctx.courses.size());
        vo.setTotalSeconds(ctx.progressList.stream()
                .mapToLong(p -> safeLong(p.getLiveSeconds()) + safeLong(p.getPlaybackSeconds())).sum());
        vo.setStudentCount(ctx.participantIdsByCourse.values().stream()
                .flatMap(Set::stream).collect(Collectors.toSet()).size());
        // 作业提交率口径：提交数 / (作业总数 × 参与学生数)，无作业或无学生时为 0
        long homeworkTotal = ctx.homeworkList.size();
        int students = vo.getStudentCount();
        vo.setHomeworkRate(homeworkTotal == 0 || students == 0 ? 0
                : (int) Math.round(ctx.submissionList.size() * 100.0 / (homeworkTotal * students)));
        vo.setExamAvg(avgRecordScore(ctx.gradedRecords));
        return vo;
    }

    @Override
    public List<CourseStatsVO> courseStats() {
        LoginUser current = SecurityUtils.getCurrentUser();
        StatsContext ctx = loadContext(current);
        Map<Long, String> teacherNameMap = loadUserNames(
                ctx.courses.stream().map(Course::getTeacherId).collect(Collectors.toSet()));
        Map<Long, Long> homeworkTotalMap = countByCourse(ctx.homeworkList, Homework::getCourseId);
        Map<Long, Long> homeworkSubmittedMap = countByCourse(ctx.submissionList,
                s -> ctx.homeworkCourseMap.get(s.getHomeworkId()));
        Map<Long, List<Integer>> examScoreMap = groupScoresByCourse(ctx.gradedRecords, ctx.examMap);
        Map<Long, Long> secondsMap = ctx.progressList.stream().collect(Collectors.groupingBy(
                StudyProgress::getCourseId,
                Collectors.summingLong(p -> safeLong(p.getLiveSeconds()) + safeLong(p.getPlaybackSeconds()))));

        return ctx.courses.stream().map(c -> {
            CourseStatsVO vo = new CourseStatsVO();
            vo.setCourseId(c.getId());
            vo.setCourseName(c.getCourseName());
            vo.setTeacherName(teacherNameMap.get(c.getTeacherId()));
            vo.setTotalSeconds(secondsMap.getOrDefault(c.getId(), 0L));
            vo.setStudentCount(ctx.participantIdsByCourse.getOrDefault(c.getId(), Set.of()).size());
            vo.setHomeworkTotal(homeworkTotalMap.getOrDefault(c.getId(), 0L).intValue());
            vo.setHomeworkSubmitted(homeworkSubmittedMap.getOrDefault(c.getId(), 0L).intValue());
            vo.setExamAvg(avgScore(examScoreMap.get(c.getId())));
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public ScoreDistributionVO scoreDistribution(Long courseId) {
        LoginUser current = SecurityUtils.getCurrentUser();
        Course course = courseMapper.selectById(courseId);
        if (course == null) {
            throw new BizException("课程不存在");
        }
        if ("TEACHER".equals(current.getRoleCode()) && !course.getTeacherId().equals(current.getUserId())) {
            throw new BizException("无权查看该课程统计");
        }
        List<Exam> exams = examMapper.selectList(new LambdaQueryWrapper<Exam>().eq(Exam::getCourseId, courseId));
        Map<Long, Exam> examMap = exams.stream().collect(Collectors.toMap(Exam::getId, Function.identity()));

        ScoreDistributionVO vo = new ScoreDistributionVO();
        vo.setCourseId(courseId);
        vo.setLow(0);
        vo.setMid(0);
        vo.setHigh(0);
        vo.setTotal(0);
        if (exams.isEmpty()) {
            return vo;
        }
        List<ExamRecord> records = recordMapper.selectList(new LambdaQueryWrapper<ExamRecord>()
                .eq(ExamRecord::getStatus, 2)
                .in(ExamRecord::getExamId, examMap.keySet()));
        for (ExamRecord r : records) {
            Exam exam = examMap.get(r.getExamId());
            if (exam == null || exam.getTotalScore() == null || exam.getTotalScore() <= 0
                    || r.getTotalScore() == null) {
                continue;
            }
            double rate = r.getTotalScore() * 100.0 / exam.getTotalScore();
            if (rate < 60) {
                vo.setLow(vo.getLow() + 1);
            } else if (rate < 80) {
                vo.setMid(vo.getMid() + 1);
            } else {
                vo.setHigh(vo.getHigh() + 1);
            }
            vo.setTotal(vo.getTotal() + 1);
        }
        return vo;
    }

    @Override
    public List<StudentStatsVO> studentStats() {
        LoginUser current = SecurityUtils.getCurrentUser();
        StatsContext ctx = loadContext(current);
        if (ctx.participantIdsByCourse.isEmpty()) {
            return List.of();
        }
        Set<Long> studentIds = ctx.participantIdsByCourse.values().stream()
                .flatMap(Set::stream).collect(Collectors.toSet());
        Map<Long, String> nameMap = loadUserNames(studentIds);

        int homeworkTotal = ctx.homeworkList.size();
        Map<Long, Long> submittedByStudent = ctx.submissionList.stream()
                .collect(Collectors.groupingBy(HomeworkSubmission::getStudentId, Collectors.counting()));
        Map<Long, List<Integer>> scoresByStudent = ctx.gradedRecords.stream()
                .filter(r -> r.getTotalScore() != null)
                .collect(Collectors.groupingBy(ExamRecord::getStudentId,
                        Collectors.mapping(ExamRecord::getTotalScore, Collectors.toList())));
        Map<Long, Long> secondsByStudent = new HashMap<>();
        Map<Long, LocalDateTime> lastStudyByStudent = new HashMap<>();
        for (StudyProgress p : ctx.progressList) {
            secondsByStudent.merge(p.getStudentId(),
                    safeLong(p.getLiveSeconds()) + safeLong(p.getPlaybackSeconds()), Long::sum);
            lastStudyByStudent.merge(p.getStudentId(), p.getLastStudyTime(),
                    (a, b) -> a == null ? b : (b == null || a.isAfter(b)) ? a : b);
        }

        return studentIds.stream().map(sid -> {
            StudentStatsVO vo = new StudentStatsVO();
            vo.setStudentId(sid);
            vo.setStudentName(nameMap.get(sid));
            vo.setTotalSeconds(secondsByStudent.getOrDefault(sid, 0L));
            int submitted = submittedByStudent.getOrDefault(sid, 0L).intValue();
            vo.setHomeworkSubmitted(submitted);
            vo.setHomeworkRate(homeworkTotal == 0 ? 0 : (int) Math.round(submitted * 100.0 / homeworkTotal));
            vo.setExamAvg(avgScore(scoresByStudent.get(sid)));
            vo.setLastStudyTime(lastStudyByStudent.get(sid));
            return vo;
        }).sorted((a, b) -> Long.compare(b.getTotalSeconds(), a.getTotalSeconds()))
                .collect(Collectors.toList());
    }

    @Override
    public ExportFile export(String dimension, String format) {
        boolean isCourse = "course".equals(dimension);
        if (!isCourse && !"student".equals(dimension)) {
            throw new BizException("非法的导出维度");
        }
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseName = (isCourse ? "课程统计_" : "学生统计_") + date;
        String[] headers = isCourse
                ? new String[]{"课程名称", "讲师", "学习总时长(小时)", "参与学生数", "作业总数", "作业提交数", "考试平均分"}
                : new String[]{"学生姓名", "学习总时长(小时)", "作业提交数", "作业完成率(%)", "考试平均分", "最近学习时间"};
        List<String[]> rows = new ArrayList<>();
        if (isCourse) {
            for (CourseStatsVO c : courseStats()) {
                rows.add(new String[]{c.getCourseName(), nullToEmpty(c.getTeacherName()),
                        toHours(c.getTotalSeconds()), String.valueOf(c.getStudentCount()),
                        String.valueOf(c.getHomeworkTotal()), String.valueOf(c.getHomeworkSubmitted()),
                        c.getExamAvg() == null ? "-" : String.valueOf(c.getExamAvg())});
            }
        } else {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            for (StudentStatsVO s : studentStats()) {
                rows.add(new String[]{nullToEmpty(s.getStudentName()), toHours(s.getTotalSeconds()),
                        String.valueOf(s.getHomeworkSubmitted()), String.valueOf(s.getHomeworkRate()),
                        s.getExamAvg() == null ? "-" : String.valueOf(s.getExamAvg()),
                        s.getLastStudyTime() == null ? "-" : s.getLastStudyTime().format(fmt)});
            }
        }

        if ("csv".equals(format)) {
            return new ExportFile(baseName + ".csv", "text/csv;charset=UTF-8", buildCsv(headers, rows));
        }
        if ("excel".equals(format)) {
            return new ExportFile(baseName + ".xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    buildExcel(isCourse ? "课程统计" : "学生统计", headers, rows));
        }
        throw new BizException("非法的导出格式");
    }

    // ---------- 私有方法 ----------

    /**
     * 加载统计上下文：可见课程 + 范围内的进度/作业/提交/考试/已批改答卷，
     * 以及各课程参与学生集合（有任一观看/提交/答卷行为）。
     */
    private StatsContext loadContext(LoginUser current) {
        List<Long> visibleCourseIds = resolveVisibleCourseIds(current);
        List<Course> courses = visibleCourseIds == null
                ? courseMapper.selectList(null)
                : (visibleCourseIds.isEmpty() ? List.of()
                        : courseMapper.selectBatchIds(visibleCourseIds).stream()
                                .sorted((a, b) -> Long.compare(a.getId(), b.getId())).collect(Collectors.toList()));
        StatsContext ctx = new StatsContext();
        ctx.courses = courses;
        if (courses.isEmpty()) {
            ctx.empty();
            return ctx;
        }
        List<Long> courseIds = courses.stream().map(Course::getId).collect(Collectors.toList());

        ctx.progressList = progressMapper.selectList(
                new LambdaQueryWrapper<StudyProgress>().in(StudyProgress::getCourseId, courseIds));
        ctx.homeworkList = homeworkMapper.selectList(
                new LambdaQueryWrapper<Homework>().in(Homework::getCourseId, courseIds));
        ctx.homeworkCourseMap = ctx.homeworkList.stream()
                .collect(Collectors.toMap(Homework::getId, Homework::getCourseId));
        ctx.submissionList = ctx.homeworkCourseMap.isEmpty() ? List.of()
                : submissionMapper.selectList(new LambdaQueryWrapper<HomeworkSubmission>()
                        .in(HomeworkSubmission::getHomeworkId, ctx.homeworkCourseMap.keySet()));
        List<Exam> exams = examMapper.selectList(
                new LambdaQueryWrapper<Exam>().in(Exam::getCourseId, courseIds));
        ctx.examMap = exams.stream().collect(Collectors.toMap(Exam::getId, Function.identity()));
        ctx.gradedRecords = exams.isEmpty() ? List.of()
                : recordMapper.selectList(new LambdaQueryWrapper<ExamRecord>()
                        .eq(ExamRecord::getStatus, 2)
                        .in(ExamRecord::getExamId, ctx.examMap.keySet()));

        // 参与学生集合：观看 / 作业提交 / 已批改答卷
        Map<Long, Set<Long>> participants = new HashMap<>();
        ctx.progressList.forEach(p -> participants.computeIfAbsent(p.getCourseId(), k -> new HashSet<>())
                .add(p.getStudentId()));
        ctx.submissionList.forEach(s -> {
            Long cid = ctx.homeworkCourseMap.get(s.getHomeworkId());
            if (cid != null) {
                participants.computeIfAbsent(cid, k -> new HashSet<>()).add(s.getStudentId());
            }
        });
        ctx.gradedRecords.forEach(r -> {
            Exam exam = ctx.examMap.get(r.getExamId());
            if (exam != null) {
                participants.computeIfAbsent(exam.getCourseId(), k -> new HashSet<>()).add(r.getStudentId());
            }
        });
        ctx.participantIdsByCourse = participants;
        return ctx;
    }

    private List<Long> resolveVisibleCourseIds(LoginUser current) {
        if ("TEACHER".equals(current.getRoleCode())) {
            return courseMapper.selectList(new LambdaQueryWrapper<Course>()
                            .eq(Course::getTeacherId, current.getUserId()))
                    .stream().map(Course::getId).collect(Collectors.toList());
        }
        return null;
    }

    private Map<Long, String> loadUserNames(Set<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        return userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(SysUser::getId,
                        u -> u.getRealName() == null ? u.getUsername() : u.getRealName()));
    }

    private Map<Long, List<Integer>> groupScoresByCourse(List<ExamRecord> records, Map<Long, Exam> examMap) {
        return records.stream().filter(r -> r.getTotalScore() != null && examMap.containsKey(r.getExamId()))
                .collect(Collectors.groupingBy(r -> examMap.get(r.getExamId()).getCourseId(),
                        Collectors.mapping(ExamRecord::getTotalScore, Collectors.toList())));
    }

    private Integer avgRecordScore(List<ExamRecord> records) {
        if (records == null || records.isEmpty()) {
            return null;
        }
        return avgScore(records.stream().map(ExamRecord::getTotalScore)
                .filter(Objects::nonNull).collect(Collectors.toList()));
    }

    private Integer avgScore(List<Integer> scores) {
        if (scores == null || scores.isEmpty()) {
            return null;
        }
        return (int) Math.round(scores.stream().mapToInt(Integer::intValue).average().orElse(0));
    }

    private <T> Map<Long, Long> countByCourse(List<T> list, Function<T, Long> courseIdGetter) {
        return list.stream().map(courseIdGetter).filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
    }

    private long safeLong(Integer v) {
        return v == null ? 0 : v;
    }

    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private String toHours(Long seconds) {
        return String.format("%.2f", (seconds == null ? 0 : seconds) / 3600.0);
    }

    private byte[] buildCsv(String[] headers, List<String[]> rows) {
        StringBuilder sb = new StringBuilder("﻿");
        sb.append(String.join(",", headers)).append("\r\n");
        for (String[] row : rows) {
            sb.append(java.util.Arrays.stream(row)
                    .map(cell -> {
                        String v = cell == null ? "" : cell;
                        return (v.contains(",") || v.contains("\"") || v.contains("\n"))
                                ? "\"" + v.replace("\"", "\"\"") + "\"" : v;
                    })
                    .collect(Collectors.joining(","))).append("\r\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] buildExcel(String sheetName, String[] headers, List<String[]> rows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(sheetName);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
                headerRow.getCell(i).setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 18 * 256);
            }
            for (int r = 0; r < rows.size(); r++) {
                Row row = sheet.createRow(r + 1);
                String[] cells = rows.get(r);
                for (int c = 0; c < cells.length; c++) {
                    row.createCell(c).setCellValue(cells[c]);
                }
            }
            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new BizException("导出文件生成失败");
        }
    }

    /** 统计上下文（一次查询，多接口复用的中间数据） */
    private static class StatsContext {
        List<Course> courses = List.of();
        List<StudyProgress> progressList = List.of();
        List<Homework> homeworkList = List.of();
        List<HomeworkSubmission> submissionList = List.of();
        List<ExamRecord> gradedRecords = List.of();
        Map<Long, Long> homeworkCourseMap = Map.of();
        Map<Long, Exam> examMap = Map.of();
        Map<Long, Set<Long>> participantIdsByCourse = Map.of();

        void empty() {
            progressList = List.of();
            homeworkList = List.of();
            submissionList = List.of();
            gradedRecords = List.of();
            homeworkCourseMap = Map.of();
            examMap = Map.of();
            participantIdsByCourse = Map.of();
        }
    }
}
