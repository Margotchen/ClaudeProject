package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.HeartbeatDTO;
import com.edu.platform.entity.StudyProgress;
import com.edu.platform.vo.MyProgressVO;

/**
 * 学习进度服务
 */
public interface StudyProgressService extends IService<StudyProgress> {

    /** 学习时长心跳上报（直播/录播观看） */
    void heartbeat(HeartbeatDTO dto);

    /** 学生个人学习进度（汇总 + 各课程明细） */
    MyProgressVO myProgress();
}
