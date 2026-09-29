const { Op } = require('sequelize');
const db = require('../models');
const { response } = require('../utils/response');
const exportService = require('../services/export.service');
const statisticsService = require('../services/statistics.service');

const { WelfareApply, WelfareApplyItem, WelfareActivity, SysUser } = db;

function encodeFilename(filename) {
  // RFC 5987: 对中文文件名进行编码，避免响应头非法字符导致 500
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`;
}

function parseIds(ids) {
  if (!ids) return null;
  const raw = Array.isArray(ids) ? ids : String(ids).split(',');
  return raw
    .map(id => Number(id))
    .filter(id => Number.isInteger(id) && id > 0);
}

exports.exportApply = async (req, res, next) => {
  try {
    let { activityId, ids, format = 'xlsx' } = req.query;

    if (format !== 'xlsx' && format !== 'csv') {
      return res.status(400).json(response(400, '导出格式仅支持 xlsx 或 csv'));
    }

    const where = {};

    if (activityId) {
      const aid = Number(activityId);
      if (!Number.isInteger(aid) || aid <= 0) {
        return res.status(400).json(response(400, '活动 ID 格式错误'));
      }
      where.activity_id = aid;
    }

    const idList = parseIds(ids);
    if (ids !== undefined && ids !== null && ids !== '') {
      if (!idList || idList.length === 0) {
        return res.status(400).json(response(400, 'ids 参数格式错误，应为逗号分隔的正整数'));
      }
      where.id = { [Op.in]: idList };
    }

    const applies = await WelfareApply.findAll({
      where,
      include: [
        { model: WelfareActivity, as: 'activity' },
        { model: WelfareApplyItem, as: 'items' },
        { model: SysUser, as: 'user', attributes: ['id', 'user_no', 'real_name', 'department'] }
      ],
      order: [['create_time', 'DESC']]
    });

    const buffer = format === 'csv'
      ? await exportService.exportApplyToCsv(applies)
      : await exportService.exportApplyToExcel(applies);

    const contentType = format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const filename = `申领明细_${Date.now()}.${format}`;
    res.setHeader('Content-Disposition', encodeFilename(filename));
    res.setHeader('Content-Type', contentType);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

exports.exportStatistics = async (req, res, next) => {
  try {
    const buffer = await exportService.buildStatisticsWorkbook(statisticsService);

    const filename = `统计报表_${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', encodeFilename(filename));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};
