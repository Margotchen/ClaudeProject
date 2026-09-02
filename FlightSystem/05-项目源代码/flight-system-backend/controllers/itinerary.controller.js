const itineraryService = require('../services/itinerary.service');
const { response, throwError } = require('../utils/response');

exports.getItinerary = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const order = await itineraryService.getItineraryData(req.params.orderId);
    if (order.user_id !== req.user.id && req.user.roleCode !== 'service' && req.user.roleCode !== 'operator') {
      throwError('Forbidden', 403);
    }
    res.json(response(200, 'OK', order));
  } catch (err) {
    next(err);
  }
};

exports.downloadPDF = async (req, res, next) => {
  try {
    if (!req.user) throwError('Unauthorized', 401);
    const { pdfData, order } = await itineraryService.generatePDF(req.params.orderId);
    if (order.user_id !== req.user.id && req.user.roleCode !== 'service' && req.user.roleCode !== 'operator') {
      throwError('Forbidden', 403);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=itinerary-${order.order_no}.pdf`);
    res.send(pdfData);
  } catch (err) {
    next(err);
  }
};
