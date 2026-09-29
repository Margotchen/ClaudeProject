package com.edu.platform.service;

import com.edu.platform.vo.CourseStatsVO;
import com.edu.platform.vo.ScoreDistributionVO;
import com.edu.platform.vo.StatsOverviewVO;
import com.edu.platform.vo.StudentStatsVO;

import java.util.List;

/**
 * 学习统计分析服务
 */
public interface StatsService {

    /** 统计总览（按当前角色数据范围） */
    StatsOverviewVO overview();

    /** 课程维度统计列表 */
    List<CourseStatsVO> courseStats();

    /** 指定课程的成绩分布（按得分率分桶） */
    ScoreDistributionVO scoreDistribution(Long courseId);

    /** 学生维度统计列表 */
    List<StudentStatsVO> studentStats();

    /**
     * 导出统计报表
     *
     * @param dimension course|student
     * @param format    excel|csv
     * @return 文件字节内容
     */
    ExportFile export(String dimension, String format);

    /** 导出文件载体 */
    record ExportFile(String fileName, String contentType, byte[] content) {
    }
}
