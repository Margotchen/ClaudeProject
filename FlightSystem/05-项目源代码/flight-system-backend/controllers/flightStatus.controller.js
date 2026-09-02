const flightStatusService = require('../services/flightStatus.service');
const { response, pageResponse, throwError } = require('../utils/response');

exports.listStatuses = async (req, res, next) => {
  try {
    const result = await flightStatusService.listStatuses({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      flightNo: req.query.flightNo || '',
      flightDate: req.query.flightDate || null,
      status: req.query.status
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const schedule = await flightStatusService.getStatusByScheduleId(req.params.scheduleId);
    if (!schedule) throwError('Schedule not found', 404);
    res.json(response(200, 'OK', schedule));
  } catch (err) {
    next(err);
  }
};
