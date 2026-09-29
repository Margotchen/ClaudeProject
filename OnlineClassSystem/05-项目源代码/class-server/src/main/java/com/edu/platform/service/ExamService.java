package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.ExamGradeDTO;
import com.edu.platform.dto.ExamQueryDTO;
import com.edu.platform.dto.ExamSaveDTO;
import com.edu.platform.dto.ExamSubmitDTO;
import com.edu.platform.entity.Exam;
import com.edu.platform.vo.ExamDetailVO;
import com.edu.platform.vo.ExamRecordVO;
import com.edu.platform.vo.ExamVO;

/**
 * 考试服务
 */
public interface ExamService extends IService<Exam> {

    Page<ExamVO> pageExams(ExamQueryDTO query);

    /** 考试详情：学生视角剥离答案 */
    ExamDetailVO getDetail(Long id);

    void createExam(ExamSaveDTO dto);

    void updateExam(ExamSaveDTO dto);

    void deleteExam(Long id);

    /** 学生开始考试：创建/续答答卷记录 */
    ExamDetailVO startExam(Long id);

    /** 学生交卷：客观题自动判分 */
    void submitExam(ExamSubmitDTO dto);

    /** 某考试的答卷分页（管理视角） */
    Page<ExamRecordVO> pageRecords(Long examId, Integer pageNum, Integer pageSize);

    /** 答卷详情（批改用，含题目与学生答案） */
    ExamRecordVO getRecordDetail(Long recordId);

    /** 学生查自己某考试的历次成绩 */
    java.util.List<ExamRecordVO> myRecords(Long examId);

    /** 讲师批改简答题 */
    void grade(ExamGradeDTO dto);
}
