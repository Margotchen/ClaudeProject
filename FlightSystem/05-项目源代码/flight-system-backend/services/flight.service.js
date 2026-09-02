const { Op } = require('sequelize');
const db = require('../models');
const { throwError } = require('../utils/response');

const {
  Airport, Aircraft, Flight, FlightSchedule, SeatInventory, FlightStatus, Order, Notification
} = db;

const CABIN_CLASSES = ['economy', 'business', 'first'];

class FlightService {
  // Flight CRUD
  async createFlight(data) {
    const { flightNo, departureAirportCode, arrivalAirportCode, plannedDuration } = data;
    const dep = await Airport.findOne({ where: { airport_code: departureAirportCode } });
    const arr = await Airport.findOne({ where: { airport_code: arrivalAirportCode } });
    if (!dep || !arr) throwError('Airport not found');

    const existing = await Flight.findOne({ where: { flight_no: flightNo } });
    if (existing) throwError('Flight number already exists');

    return await Flight.create({
      flight_no: flightNo,
      departure_airport_id: dep.id,
      arrival_airport_id: arr.id,
      planned_duration: plannedDuration
    });
  }

  async updateFlight(id, data) {
    const flight = await Flight.findByPk(id);
    if (!flight) throwError('Flight not found', 404);

    const updateData = {};
    if (data.flightNo) updateData.flight_no = data.flightNo;
    if (data.departureAirportCode) {
      const dep = await Airport.findOne({ where: { airport_code: data.departureAirportCode } });
      if (!dep) throwError('Departure airport not found');
      updateData.departure_airport_id = dep.id;
    }
    if (data.arrivalAirportCode) {
      const arr = await Airport.findOne({ where: { airport_code: data.arrivalAirportCode } });
      if (!arr) throwError('Arrival airport not found');
      updateData.arrival_airport_id = arr.id;
    }
    if (data.plannedDuration !== undefined) updateData.planned_duration = data.plannedDuration;

    await flight.update(updateData);
    return flight;
  }

  async deleteFlight(id) {
    const flight = await Flight.findByPk(id);
    if (!flight) throwError('Flight not found', 404);
    await flight.destroy();
  }

  async listFlights({ page = 1, pageSize = 10, keyword = '' }) {
    const where = {};
    if (keyword) {
      where.flight_no = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Flight.findAndCountAll({
      where,
      include: [
        { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'airport_name', 'city_name'] },
        { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'airport_name', 'city_name'] }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['flight_no', 'ASC']]
    });

    return {
      list: rows,
      pagination: { page, pageSize, total: count }
    };
  }

  async getFlightDetail(id) {
    const flight = await Flight.findByPk(id, {
      include: [
        { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'airport_name', 'city_name'] },
        { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'airport_name', 'city_name'] }
      ]
    });
    if (!flight) throwError('Flight not found', 404);
    return flight;
  }

  // Schedule CRUD
  async createSchedule(data) {
    const { flightId, aircraftId, flightDate, departureTime, arrivalTime, economyPrice, businessPrice, firstPrice } = data;
    const flight = await Flight.findByPk(flightId);
    if (!flight) throwError('Flight not found');
    const aircraft = await Aircraft.findByPk(aircraftId);
    if (!aircraft) throwError('Aircraft not found');

    const schedule = await db.sequelize.transaction(async (t) => {
      const created = await FlightSchedule.create({
        flight_id: flightId,
        aircraft_id: aircraftId,
        flight_date: flightDate,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        economy_price: economyPrice,
        business_price: businessPrice,
        first_price: firstPrice,
        status: 1,
        delay_minutes: 0
      }, { transaction: t });

      const layout = JSON.parse(aircraft.layout || '{}');
      for (const cabin of CABIN_CLASSES) {
        const config = layout[cabin] || {};
        const rows = parseInt(config.rows, 10) || 0;
        const cols = parseInt(config.cols, 10) || 0;
        const total = rows * cols;
        await SeatInventory.create({
          schedule_id: created.id,
          cabin_class: cabin,
          available_seats: total,
          total_seats: total
        }, { transaction: t });
      }

      await FlightStatus.create({
        schedule_id: created.id,
        status: 1,
        delay_minutes: 0
      }, { transaction: t });

      return created;
    });

    return schedule;
  }

  async updateSchedule(id, data) {
    const schedule = await FlightSchedule.findByPk(id);
    if (!schedule) throwError('Schedule not found', 404);

    const updateData = {};
    if (data.aircraftId !== undefined) updateData.aircraft_id = data.aircraftId;
    if (data.flightDate !== undefined) updateData.flight_date = data.flightDate;
    if (data.departureTime !== undefined) updateData.departure_time = data.departureTime;
    if (data.arrivalTime !== undefined) updateData.arrival_time = data.arrivalTime;
    if (data.economyPrice !== undefined) updateData.economy_price = data.economyPrice;
    if (data.businessPrice !== undefined) updateData.business_price = data.businessPrice;
    if (data.firstPrice !== undefined) updateData.first_price = data.firstPrice;

    await schedule.update(updateData);
    return schedule;
  }

  async deleteSchedule(id) {
    const schedule = await FlightSchedule.findByPk(id);
    if (!schedule) throwError('Schedule not found', 404);
    await schedule.destroy();
  }

  async getScheduleDetail(id) {
    const schedule = await FlightSchedule.findByPk(id, {
      include: [
        {
          model: Flight,
          as: 'flight',
          include: [
            { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'airport_name', 'city_name'] },
            { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'airport_name', 'city_name'] }
          ]
        },
        { model: Aircraft, as: 'aircraft', attributes: ['model', 'layout'] },
        { model: SeatInventory, as: 'seatInventories', attributes: ['cabin_class', 'available_seats', 'total_seats'] },
        { model: FlightStatus, as: 'flightStatus', attributes: ['status', 'delay_minutes', 'reason'] }
      ]
    });
    if (!schedule) throwError('Schedule not found', 404);
    return schedule;
  }

  async listSchedules({ page = 1, pageSize = 10, flightId, flightDate, status }) {
    const where = {};
    if (flightId) where.flight_id = flightId;
    if (flightDate) where.flight_date = flightDate;
    if (status !== undefined && status !== '') where.status = status;

    const { count, rows } = await FlightSchedule.findAndCountAll({
      where,
      include: [
        { model: Flight, as: 'flight', attributes: ['flight_no'], include: [
          { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
          { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
        ]},
        { model: Aircraft, as: 'aircraft', attributes: ['model'] },
        { model: SeatInventory, as: 'seatInventories', attributes: ['cabin_class', 'available_seats', 'total_seats'] }
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

  // Search flights for passengers
  async searchFlights({ originCode, destinationCode, flightDate, page = 1, pageSize = 10 }) {
    if (!originCode || !destinationCode || !flightDate) {
      throwError('Origin, destination and date are required');
    }

    const origin = await Airport.findOne({ where: { airport_code: originCode } });
    const dest = await Airport.findOne({ where: { airport_code: destinationCode } });
    if (!origin || !dest) throwError('Airport not found');

    const where = {
      flight_date: flightDate,
      status: { [Op.ne]: 3 } // exclude cancelled
    };

    const { count, rows } = await FlightSchedule.findAndCountAll({
      where,
      include: [
        {
          model: Flight,
          as: 'flight',
          where: {
            departure_airport_id: origin.id,
            arrival_airport_id: dest.id
          },
          include: [
            { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'airport_name', 'city_name'] },
            { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'airport_name', 'city_name'] }
          ]
        },
        { model: Aircraft, as: 'aircraft', attributes: ['model'] },
        { model: SeatInventory, as: 'seatInventories', attributes: ['cabin_class', 'available_seats', 'total_seats'] },
        { model: FlightStatus, as: 'flightStatus', attributes: ['status', 'delay_minutes', 'reason'] }
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

  // Flight status update
  async updateFlightStatus(scheduleId, { status, delayMinutes, reason }) {
    const schedule = await FlightSchedule.findByPk(scheduleId, {
      include: [
        { model: Flight, as: 'flight', attributes: ['flight_no'] }
      ]
    });
    if (!schedule) throwError('Schedule not found', 404);

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (delayMinutes !== undefined) updateData.delay_minutes = delayMinutes;

    await schedule.update(updateData);

    const [flightStatus] = await FlightStatus.findOrCreate({
      where: { schedule_id: scheduleId },
      defaults: { status: 1, delay_minutes: 0 }
    });
    await flightStatus.update({
      status: status !== undefined ? status : flightStatus.status,
      delay_minutes: delayMinutes !== undefined ? delayMinutes : flightStatus.delay_minutes,
      reason: reason !== undefined ? reason : flightStatus.reason
    });

    // Notify affected passengers when delayed or cancelled
    if (status === 2 || status === 3) {
      const orders = await Order.findAll({
        where: { schedule_id: scheduleId, status: { [Op.in]: [1, 2, 3] } },
        attributes: ['user_id']
      });
      const flightNo = schedule.flight?.flight_no || 'Unknown';
      const title = status === 2 ? 'Flight Delayed' : 'Flight Cancelled';
      const content = status === 2
        ? `Your flight ${flightNo} has been delayed by ${delayMinutes || 0} minutes. Reason: ${reason || 'Unknown'}`
        : `Your flight ${flightNo} has been cancelled. Reason: ${reason || 'Unknown'}`;
      const notifications = orders.map(o => ({
        user_id: o.user_id,
        title,
        content,
        is_read: 0
      }));
      if (notifications.length > 0) {
        await Notification.bulkCreate(notifications);
      }
    }

    return schedule;
  }
}

module.exports = new FlightService();
