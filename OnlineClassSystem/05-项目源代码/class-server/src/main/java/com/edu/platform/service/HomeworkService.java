package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.HomeworkGradeDTO;
import com.edu.platform.dto.HomeworkQueryDTO;
import com.edu.platform.dto.HomeworkSaveDTO;
import com.edu.platform.dto.HomeworkSubmitDTO;
import com.edu.platform.entity.Homework;
import com.edu.platform.vo.HomeworkSubmissionVO;
import com.edu.platform.vo.HomeworkVO;

/**
 * 作业服务
 */
public interface HomeworkService extends IService<Homework> {

    Page<HomeworkVO> pageHomework(HomeworkQueryDTO query);

    void createHomework(HomeworkSaveDTO dto);

    void updateHomework(HomeworkSaveDTO dto);

    void deleteHomework(Long id);

    /** 学生提交作业（重复提交覆盖并重置为待批改） */
    void submit(HomeworkSubmitDTO dto);

    /** 某作业的提交记录分页（管理视角） */
    Page<HomeworkSubmissionVO> pageSubmissions(Long homeworkId, Integer pageNum, Integer pageSize);

    /** 学生查看自己对某作业的提交 */
    HomeworkSubmissionVO mySubmission(Long homeworkId);

    /** 讲师批改作业 */
    void grade(HomeworkGradeDTO dto);
}
