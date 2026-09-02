const paymentService = require('../services/payment.service');
const { response, throwError } = require('../utils/response');

exports.simulatePayment = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const result = await paymentService.simulatePayment(req.user.id, req.body);
    const message = result.success ? 'Payment successful' : 'Payment failed';
    res.json(response(result.success ? 200 : 400, message, result.payment));
  } catch (err) {
    next(err);
  }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const payment = await paymentService.getPaymentStatus(req.params.orderId);
    res.json(response(200, 'OK', payment));
  } catch (err) {
    next(err);
  }
};
