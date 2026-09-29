const refundChangeService = require('../services/refundChange.service');
const { response, pageResponse, throwError } = require('../utils/response');

exports.applyRefund = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const application = await refundChangeService.applyRefund(req.user.id, req.body);
    res.json(response(200, 'Refund application submitted', application));
  } catch (err) {
    next(err);
  }
};

exports.applyChange = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const application = await refundChangeService.applyChange(req.user.id, req.body);
    res.json(response(200, 'Change application submitted', application));
  } catch (err) {
    next(err);
  }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await refundChangeService.getMyApplications(req.user.id, {
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.getPendingApplications = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await refundChangeService.getPendingApplications({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.processApplication = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const application = await refundChangeService.processApplication(req.params.id, req.body);
    res.json(response(200, 'Application processed', application));
  } catch (err) {
    next(err);
  }
};
