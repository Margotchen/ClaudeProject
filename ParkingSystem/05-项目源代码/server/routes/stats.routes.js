const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { success } = require('../utils/response');
const statsService = require('../services/stats.service');

const router = express.Router();

// 概览统计
router.get('/overview', authMiddleware(), async (req, res, next) => {
  try {
    const data = await statsService.getOverview();
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// 区域使用率
router.get('/area-utilization', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const data = await statsService.getAreaUtilization(req.query.date);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// 时段趋势
router.get('/time-trend', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const data = await statsService.getTimeTrend(parseInt(req.query.days) || 7);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// 详细数据
router.get('/details', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const data = await statsService.getDetailedStats(req.query.date);
    success(res, data);
  } catch (err) {
    next(err);
  }
});

// CSV 导出
router.get('/export', authMiddleware(['parking_admin', 'system_admin']), async (req, res, next) => {
  try {
    const data = await statsService.getDetailedStats(req.query.date);
    const headers = ['日期', '区域', '时段', '总车位', '已使用', '使用率(%)'];
    const rows = data.map(item => [
      item.date,
      item.area,
      { morning: '上午', afternoon: '下午', all_day: '全天' }[item.timeSlot],
      item.total,
      item.used,
      item.rate
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=车位使用统计.csv');
    res.send('﻿' + csvContent);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
