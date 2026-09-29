package com.edu.platform.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.edu.platform.dto.PlaybackQueryDTO;
import com.edu.platform.entity.PlaybackVideo;
import com.edu.platform.vo.PlaybackVO;

import java.nio.file.Path;

public interface PlaybackVideoService extends IService<PlaybackVideo> {

    /**
     * 分页查询录播（角色过滤：学生仅上架课程，讲师仅自己课程）
     */
    Page<PlaybackVO> pagePlayback(PlaybackQueryDTO query);

    /**
     * 上架/下架录播（管理员/本课程讲师）
     */
    void updateStatus(Long id, Integer status);

    /**
     * 删除录播（管理员/本课程讲师），同时删除录制文件
     */
    void deletePlayback(Long id);

    /**
     * 处理 SRS on_dvr 回调：登记录制文件为录播视频（幂等）
     *
     * @param stream 流名，格式 schedule_{id}
     * @param file   容器内文件绝对路径（/data/dvr/...）
     */
    void onDvrCallback(String stream, String file);

    /**
     * 校验当前用户可访问该录播并返回记录
     */
    PlaybackVideo getAccessible(Long id);

    /**
     * 解析录制文件名到本地文件路径（防路径穿越）
     */
    Path resolveFile(String fileName);
}
