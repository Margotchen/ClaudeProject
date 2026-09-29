package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.CourseQueryDTO;
import com.edu.platform.dto.CourseSaveDTO;
import com.edu.platform.entity.Course;
import com.edu.platform.vo.CourseVO;

public interface CourseService extends IService<Course> {

    /**
     * 分页查询课程（按角色控制数据范围：管理员/班主任全部、讲师仅自己、学生仅上架）
     */
    Page<CourseVO> pageCourses(CourseQueryDTO query);

    /**
     * 创建课程（讲师固定为自己，管理员可指定讲师）
     */
    void createCourse(CourseSaveDTO dto);

    /**
     * 编辑课程（管理员任意，讲师仅自己的课程）
     */
    void updateCourse(CourseSaveDTO dto);

    /**
     * 删除课程（管理员任意，讲师仅自己的课程）
     */
    void deleteCourse(Long id);

    /**
     * 上架/下架课程（管理员任意，讲师仅自己的课程）
     */
    void updateStatus(Long id, Integer status);

    /**
     * 校验当前用户是否有权管理该课程（管理员或课程所属讲师），无权时抛业务异常
     */
    Course checkManageable(Long courseId);
}
