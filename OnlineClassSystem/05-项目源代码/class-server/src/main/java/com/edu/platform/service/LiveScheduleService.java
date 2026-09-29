package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.ScheduleQueryDTO;
import com.edu.platform.dto.ScheduleSaveDTO;
import com.edu.platform.entity.LiveSchedule;
import com.edu.platform.security.LoginUser;
import com.edu.platform.vo.ScheduleVO;

public interface LiveScheduleService extends IService<LiveSchedule> {

    /**
     * 分页查询排课（按角色控制数据范围：学生仅可见上架课程的排课，讲师仅自己课程的排课）
     */
    Page<ScheduleVO> pageSchedules(ScheduleQueryDTO query);

    /**
     * 新增排课（管理员任意课程，讲师仅自己的课程）
     */
    void createSchedule(ScheduleSaveDTO dto);

    /**
     * 编辑排课（仅未开始的排课可编辑）
     */
    void updateSchedule(ScheduleSaveDTO dto);

    /**
     * 删除排课（直播中的排课不可删除）
     */
    void deleteSchedule(Long id);

    /**
     * 校验当前用户有权进入指定直播间（抛 BizException 表示无权）：
     * 管理员/班主任任意房间；讲师仅自己课程；学生仅上架课程
     */
    void checkRoomAccessible(Long scheduleId, LoginUser user);
}
