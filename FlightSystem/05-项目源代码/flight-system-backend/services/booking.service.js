const { Op } = require('sequelize');
const db = require('../models');
const { throwError } = require('../utils/response');

const {
  Order, OrderPassenger, FlightSchedule, SeatInventory, Ticket, Payment, Flight, Airport, Aircraft, SysUser
} = db;

const CABIN_PRICE_FIELDS = {
  economy: 'economy_price',
  business: 'business_price',
  first: 'first_price'
};

function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ORD${ts}${random}`;
}

class BookingService {
  async createBooking(userId, data) {
    const { scheduleId, cabinClass, passengers, contactName, contactPhone } = data;

    if (!scheduleId || !cabinClass || !passengers || !passengers.length) {
      throwError('Schedule, cabin class and passengers are required');
    }
    if (!CABIN_PRICE_FIELDS[cabinClass]) {
      throwError('Invalid cabin class');
    }

    const schedule = await FlightSchedule.findByPk(scheduleId, {
      include: [
        { model: Flight, as: 'flight' },
        { model: Aircraft, as: 'aircraft' }
      ]
    });
    if (!schedule) throwError('Flight schedule not found', 404);
    if (schedule.status === 3) throwError('Flight has been cancelled');

    const priceField = CABIN_PRICE_FIELDS[cabinClass];
    const unitPrice = parseFloat(schedule[priceField]);
    const totalAmount = unitPrice * passengers.length;

    const result = await db.sequelize.transaction(async (t) => {
      const inventory = await SeatInventory.findOne({
        where: { schedule_id: scheduleId, cabin_class: cabinClass },
        transaction: t,
        lock: true
      });
      if (!inventory) throwError('Seat inventory not found');
      if (inventory.available_seats < passengers.length) {
        throwError('Not enough seats available');
      }

      await inventory.update({
        available_seats: inventory.available_seats - passengers.length
      }, { transaction: t });

      const order = await Order.create({
        order_no: generateOrderNo(),
        user_id: userId,
        schedule_id: scheduleId,
        cabin_class: cabinClass,
        total_amount: totalAmount,
        status: 0,
        contact_name: contactName,
        contact_phone: contactPhone
      }, { transaction: t });

      const passengerRecords = [];
      for (const p of passengers) {
        const rec = await OrderPassenger.create({
          order_id: order.id,
          name: p.name,
          id_card: p.idCard
        }, { transaction: t });
        passengerRecords.push(rec);
      }

      return { order, passengers: passengerRecords };
    });

    return this.getOrderDetail(result.order.id);
  }

  async getOrderDetail(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderPassenger,
          as: 'passengers',
          include: [
            { model: Ticket, as: 'ticket' }
          ]
        },
        {
          model: FlightSchedule,
          as: 'schedule',
          include: [
            {
              model: Flight,
              as: 'flight',
              include: [
                { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
                { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
              ]
            },
            { model: Aircraft, as: 'aircraft', attributes: ['model'] }
          ]
        },
        {
          model: Payment,
          as: 'payments'
        }
      ]
    });
    if (!order) throwError('Order not found', 404);
    return order;
  }

  async getMyOrders(userId, { page = 1, pageSize = 10, status }) {
    const where = { user_id: userId };
    if (status !== undefined && status !== '') {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: FlightSchedule,
          as: 'schedule',
          include: [
            {
              model: Flight,
              as: 'flight',
              include: [
                { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
                { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
              ]
            }
          ]
        }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return {
      list: rows,
      pagination: { page, pageSize, total: count }
    };
  }

  async getAllOrders({ page = 1, pageSize = 10, status, keyword }) {
    const where = {};
    if (status !== undefined && status !== '' && status !== null && Number.isInteger(Number(status))) {
      where.status = Number(status);
    }
    if (keyword) {
      where.order_no = { [Op.substring]: String(keyword) };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: FlightSchedule,
          as: 'schedule',
          include: [
            {
              model: Flight,
              as: 'flight',
              include: [
                { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
                { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
              ]
            }
          ]
        },
        {
          model: SysUser,
          as: 'user',
          attributes: ['username', 'real_name']
        }
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['createdAt', 'DESC']]
    });

    return {
      list: rows,
      pagination: { page, pageSize, total: count }
    };
  }

  async cancelOrder(userId, orderId) {
    const order = await Order.findByPk(orderId);
    if (!order) throwError('Order not found', 404);
    if (order.user_id !== userId) throwError('Forbidden', 403);
    if (order.status !== 0) throwError('Only pending orders can be cancelled');

    await db.sequelize.transaction(async (t) => {
      const passengerCount = await OrderPassenger.count({
        where: { order_id: orderId },
        transaction: t
      });

      const inventory = await SeatInventory.findOne({
        where: { schedule_id: order.schedule_id, cabin_class: order.cabin_class },
        transaction: t
      });
      if (inventory) {
        await inventory.update({
          available_seats: inventory.available_seats + passengerCount
        }, { transaction: t });
      }

      await order.update({ status: 6 }, { transaction: t });
    });

    return { message: 'Order cancelled' };
  }
}

module.exports = new BookingService();
