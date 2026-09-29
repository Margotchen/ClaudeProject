const { Op } = require('sequelize');
const db = require('../models');

const { FlightSchedule, Flight, Airport, Aircraft, FlightStatus } = db;

class FlightStatusService {
  async listStatuses({ page = 1, pageSize = 10, flightNo, flightDate, status }) {
    const where = {};
    if (flightDate) where.flight_date = flightDate;
    if (status !== undefined && status !== '') where.status = status;

    const flightWhere = {};
    if (flightNo) flightWhere.flight_no = { [Op.like]: `%${flightNo}%` };

    const { count, rows } = await FlightSchedule.findAndCountAll({
      where,
      include: [
        {
          model: Flight,
          as: 'flight',
          where: flightWhere,
          include: [
            { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
            { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
          ]
        },
        { model: Aircraft, as: 'aircraft', attributes: ['model'] },
        { model: FlightStatus, as: 'flightStatus' }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['departure_time', 'ASC']]
    });

    return {
      list: rows,
      pagination: { page, pageSize, total: count }
    };
  }

  async getStatusByScheduleId(scheduleId) {
    const schedule = await FlightSchedule.findByPk(scheduleId, {
      include: [
        {
          model: Flight,
          as: 'flight',
          include: [
            { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
            { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
          ]
        },
        { model: FlightStatus, as: 'flightStatus' }
      ]
    });
    return schedule;
  }
}

module.exports = new FlightStatusService();
