const exportService = require('../services/export.service');

const CONTENT_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv'
};

function sendExport(res, buffer, filename, format) {
  res.setHeader('Content-Type', CONTENT_TYPES[format] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.${format}`);
  res.send(buffer);
}

exports.exportOrders = async (req, res, next) => {
  try {
    const format = req.query.format || 'xlsx';
    const buffer = await exportService.exportOrders(format);
    sendExport(res, buffer, 'orders', format);
  } catch (err) {
    next(err);
  }
};

exports.exportFlights = async (req, res, next) => {
  try {
    const format = req.query.format || 'xlsx';
    const buffer = await exportService.exportFlights(format);
    sendExport(res, buffer, 'flights', format);
  } catch (err) {
    next(err);
  }
};
