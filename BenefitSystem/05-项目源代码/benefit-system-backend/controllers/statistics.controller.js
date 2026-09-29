const statisticsService = require('../services/statistics.service');
const { response } = require('../utils/response');

exports.dashboard = async (req, res, next) => {
  try {
    const stats = await statisticsService.getDashboardStats();
    const topGifts = await statisticsService.getTopGifts();
    const departments = await statisticsService.getDepartmentParticipation();
    const deliveryProgress = await statisticsService.getDeliveryProgress();

    res.json(response(200, '操作成功', {
      stats,
      topGifts,
      departments,
      deliveryProgress
    }));
  } catch (err) {
    next(err);
  }
};
