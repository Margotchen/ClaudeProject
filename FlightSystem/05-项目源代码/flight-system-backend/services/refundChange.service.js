const { Op } = require('sequelize');
const db = require('../models');
const { throwError } = require('../utils/response');

const {
  Order, OrderPassenger, Ticket, FlightSchedule, Flight, Airport,
  SeatInventory, RefundChange, SeatSelection
} = db;

const CHANGE_FEES = {
  economy: 0.1,
  business: 0.05,
  first: 0
};

function calculateRefundRate(hoursBefore) {
  if (hoursBefore >= 24) return 0.9;
  if (hoursBefore >= 2) return 0.7;
  return 0;
}

class RefundChangeService {
  async applyRefund(userId, { orderId, reason }) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: FlightSchedule,
          as: 'schedule'
        },
        {
          model: OrderPassenger,
          as: 'passengers'
        }
      ]
    });
    if (!order) throwError('Order not found', 404);
    if (order.user_id !== userId) throwError('Forbidden', 403);
    if (order.status !== 2 && order.status !== 3) throwError('Order cannot be refunded');

    const now = new Date();
    const departure = new Date(order.schedule.departure_time);
    const hoursBefore = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    const rate = calculateRefundRate(hoursBefore);
    const refundAmount = parseFloat((order.total_amount * rate).toFixed(2));

    const application = await RefundChange.create({
      order_id: orderId,
      type: 1,
      reason,
      fee: parseFloat((order.total_amount - refundAmount).toFixed(2)),
      refund_amount: refundAmount,
      status: 0
    });

    return application;
  }

  async applyChange(userId, { orderId, targetScheduleId, reason }) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: FlightSchedule,
          as: 'schedule'
        },
        {
          model: OrderPassenger,
          as: 'passengers'
        }
      ]
    });
    if (!order) throwError('Order not found', 404);
    if (order.user_id !== userId) throwError('Forbidden', 403);
    if (order.status !== 2 && order.status !== 3) throwError('Order cannot be changed');

    const targetSchedule = await FlightSchedule.findByPk(targetScheduleId);
    if (!targetSchedule) throwError('Target schedule not found', 404);

    const now = new Date();
    const departure = new Date(order.schedule.departure_time);
    const hoursBefore = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursBefore < 2) throwError('Change must be applied at least 2 hours before departure');

    const targetPrice = parseFloat(targetSchedule[`${order.cabin_class}_price`]);
    const unitPrice = parseFloat(order.total_amount) / order.passengers.length;
    const priceDiff = targetPrice - unitPrice;
    const passengerCount = order.passengers.length;
    const feeRate = CHANGE_FEES[order.cabin_class] || 0;
    const fee = parseFloat((unitPrice * feeRate * passengerCount).toFixed(2));
    const refundAmount = parseFloat(((-priceDiff * passengerCount - fee).toFixed(2)));

    const application = await RefundChange.create({
      order_id: orderId,
      type: 2,
      reason,
      fee,
      refund_amount: refundAmount,
      target_schedule_id: targetScheduleId,
      status: 0
    });

    return application;
  }

  async getMyApplications(userId, { page = 1, pageSize = 10 }) {
    const orders = await Order.findAll({ where: { user_id: userId }, attributes: ['id'] });
    const orderIds = orders.map(o => o.id);

    const { count, rows } = await RefundChange.findAndCountAll({
      where: { order_id: { [Op.in]: orderIds } },
      include: [
        {
          model: Order,
          as: 'order',
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

  async getPendingApplications({ page = 1, pageSize = 10 }) {
    const { count, rows } = await RefundChange.findAndCountAll({
      where: { status: 0 },
      include: [
        {
          model: Order,
          as: 'order',
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

  async processApplication(id, { status, remark }) {
    if (status !== 1 && status !== 2) throwError('Invalid status');

    const application = await RefundChange.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
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
              as: 'schedule'
            }
          ]
        }
      ]
    });
    if (!application) throwError('Application not found', 404);
    if (application.status !== 0) throwError('Application has already been processed');

    await db.sequelize.transaction(async (t) => {
      await application.update({ status }, { transaction: t });

      if (status === 1) {
        if (application.type === 1) {
          await this.processRefund(application, t);
        } else {
          await this.processChange(application, t);
        }
      }
    });

    return application;
  }

  async processRefund(application, t) {
    const order = application.order;
    const passengerCount = order.passengers.length;

    const inventory = await SeatInventory.findOne({
      where: { schedule_id: order.schedule_id, cabin_class: order.cabin_class },
      transaction: t
    });
    if (inventory) {
      await inventory.update({
        available_seats: inventory.available_seats + passengerCount
      }, { transaction: t });
    }

    for (const p of order.passengers) {
      if (p.ticket) {
        await SeatSelection.destroy({
          where: { ticket_id: p.ticket.id },
          transaction: t
        });
        await p.ticket.update({ status: 3, seat_no: null }, { transaction: t });
      }
    }

    await order.update({ status: 5 }, { transaction: t });
  }

  async processChange(application, t) {
    const order = application.order;
    const targetSchedule = await FlightSchedule.findByPk(application.target_schedule_id, { transaction: t });
    if (!targetSchedule) throwError('Target schedule not found', 404);
    if (targetSchedule.status === 3) throwError('Target flight has been cancelled');
    if (new Date(targetSchedule.departure_time) <= new Date()) throwError('Target flight has already departed');

    const targetInventory = await SeatInventory.findOne({
      where: { schedule_id: targetSchedule.id, cabin_class: order.cabin_class },
      transaction: t,
      lock: true
    });
    if (!targetInventory || targetInventory.available_seats < order.passengers.length) {
      throwError('Not enough seats on target flight');
    }

    await targetInventory.update({
      available_seats: targetInventory.available_seats - order.passengers.length
    }, { transaction: t });

    const oldInventory = await SeatInventory.findOne({
      where: { schedule_id: order.schedule_id, cabin_class: order.cabin_class },
      transaction: t
    });
    if (oldInventory) {
      await oldInventory.update({
        available_seats: oldInventory.available_seats + order.passengers.length
      }, { transaction: t });
    }

    const newTotal = parseFloat(targetSchedule[`${order.cabin_class}_price`]) * order.passengers.length;

    for (const p of order.passengers) {
      if (p.ticket) {
        await SeatSelection.destroy({
          where: { ticket_id: p.ticket.id },
          transaction: t
        });
        await p.ticket.update({
          schedule_id: targetSchedule.id,
          seat_no: null,
          status: 0
        }, { transaction: t });
      }
    }

    await order.update({
      schedule_id: targetSchedule.id,
      status: 4,
      total_amount: newTotal
    }, { transaction: t });
  }
}

module.exports = new RefundChangeService();
