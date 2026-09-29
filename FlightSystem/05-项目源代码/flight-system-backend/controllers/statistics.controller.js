const statisticsService = require('../services/statistics.service');
const { response } = require('../utils/response');

exports.getDashboard = async (req, res, next) => {
  try {
    const data = await statisticsService.getDashboard();
    res.json(response(200, 'OK', data));
  } catch (err) {
    next(err);
  }
};
