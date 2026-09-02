const checkinService = require('../services/checkin.service');
const { response, throwError } = require('../utils/response');

exports.getSeatMap = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const map = await checkinService.getSeatMap(req.params.orderId);
    res.json(response(200, 'OK', map));
  } catch (err) {
    next(err);
  }
};

exports.selectSeat = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const selection = await checkinService.selectSeat(req.user.id, req.body);
    res.json(response(200, 'Seat selected', selection));
  } catch (err) {
    next(err);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await checkinService.checkIn(req.user.id, req.params.orderId);
    res.json(response(200, result.message, result));
  } catch (err) {
    next(err);
  }
};
