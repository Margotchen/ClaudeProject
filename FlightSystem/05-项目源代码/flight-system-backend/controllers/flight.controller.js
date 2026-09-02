const flightService = require('../services/flight.service');
const { response, pageResponse, throwError } = require('../utils/response');

// Flight management
exports.createFlight = async (req, res, next) => {
  try {
    const flight = await flightService.createFlight(req.body);
    res.json(response(200, 'Flight created', flight));
  } catch (err) {
    next(err);
  }
};

exports.updateFlight = async (req, res, next) => {
  try {
    const flight = await flightService.updateFlight(req.params.id, req.body);
    res.json(response(200, 'Flight updated', flight));
  } catch (err) {
    next(err);
  }
};

exports.deleteFlight = async (req, res, next) => {
  try {
    await flightService.deleteFlight(req.params.id);
    res.json(response(200, 'Flight deleted'));
  } catch (err) {
    next(err);
  }
};

exports.listFlights = async (req, res, next) => {
  try {
    const result = await flightService.listFlights({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      keyword: req.query.keyword || ''
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

exports.getFlight = async (req, res, next) => {
  try {
    const flight = await flightService.getFlightDetail(req.params.id);
    res.json(response(200, 'OK', flight));
  } catch (err) {
    next(err);
  }
};

exports.getSchedule = async (req, res, next) => {
  try {
    const schedule = await flightService.getScheduleDetail(req.params.id);
    res.json(response(200, 'OK', schedule));
  } catch (err) {
    next(err);
  }
};

// Schedule management
exports.createSchedule = async (req, res, next) => {
  try {
    const schedule = await flightService.createSchedule(req.body);
    res.json(response(200, 'Schedule created', schedule));
  } catch (err) {
    next(err);
  }
};

exports.updateSchedule = async (req, res, next) => {
  try {
    const schedule = await flightService.updateSchedule(req.params.id, req.body);
    res.json(response(200, 'Schedule updated', schedule));
  } catch (err) {
    next(err);
  }
};

exports.deleteSchedule = async (req, res, next) => {
  try {
    await flightService.deleteSchedule(req.params.id);
    res.json(response(200, 'Schedule deleted'));
  } catch (err) {
    next(err);
  }
};

exports.listSchedules = async (req, res, next) => {
  try {
    const result = await flightService.listSchedules({
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10,
      flightId: req.query.flightId || null,
      flightDate: req.query.flightDate || null,
      status: req.query.status
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

// Passenger search
exports.searchFlights = async (req, res, next) => {
  try {
    const result = await flightService.searchFlights({
      originCode: req.query.origin,
      destinationCode: req.query.destination,
      flightDate: req.query.date,
      page: parseInt(req.query.page) || 1,
      pageSize: parseInt(req.query.pageSize) || 10
    });
    res.json(pageResponse(result.list, result.pagination));
  } catch (err) {
    next(err);
  }
};

// Flight status update
exports.updateScheduleStatus = async (req, res, next) => {
  try {
    const schedule = await flightService.updateFlightStatus(req.params.id, req.body);
    res.json(response(200, 'Flight status updated', schedule));
  } catch (err) {
    next(err);
  }
};
