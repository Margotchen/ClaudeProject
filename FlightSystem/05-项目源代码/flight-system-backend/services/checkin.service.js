const db = require('../models');
const { throwError } = require('../utils/response');

const {
  Order, OrderPassenger, Ticket, FlightSchedule, Aircraft, SeatSelection
} = db;

function parseLayout(layoutStr) {
  try {
    return JSON.parse(layoutStr || '{}');
  } catch {
    return {};
  }
}

function generateSeats(layout) {
  const seats = [];
  for (const [cabin, config] of Object.entries(layout)) {
    const rows = config.rows || 0;
    const cols = config.cols || 0;
    const startRow = config.startRow || 1;
    const letters = config.letters || generateLetters(cols);
    const cabinSeats = [];
    for (let r = 0; r < rows; r++) {
      const rowNo = startRow + r;
      const rowSeats = [];
      for (let c = 0; c < cols; c++) {
        rowSeats.push({
          seatNo: `${rowNo}${letters[c]}`,
          row: rowNo,
          col: c + 1,
          cabin
        });
      }
      cabinSeats.push({ row: rowNo, seats: rowSeats });
    }
    seats.push({ cabin, rows: cabinSeats });
  }
  return seats;
}

function generateLetters(count) {
  const letters = [];
  for (let i = 0; i < count; i++) {
    letters.push(String.fromCharCode(65 + i));
  }
  return letters;
}

class CheckinService {
  async getSeatMap(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: FlightSchedule,
          as: 'schedule',
          include: [
            { model: Aircraft, as: 'aircraft' }
          ]
        },
        {
          model: OrderPassenger,
          as: 'passengers',
          include: [
            {
              model: Ticket,
              as: 'ticket',
              include: [
                { model: SeatSelection, as: 'seatSelection' }
              ]
            }
          ]
        }
      ]
    });
    if (!order) throwError('Order not found', 404);

    const layout = parseLayout(order.schedule.aircraft.layout);
    const seats = generateSeats(layout);

    const selectedSeats = [];
    order.passengers.forEach(p => {
      const ticket = p.ticket;
      if (ticket) {
        selectedSeats.push({
          seatNo: ticket.seatSelection?.seat_no || ticket.seat_no || null,
          ticketId: ticket.id,
          passengerName: p.name
        });
      }
    });

    return {
      cabinClass: order.cabin_class,
      seats,
      selectedSeats,
      orderStatus: order.status,
      departureTime: order.schedule.departure_time
    };
  }

  async selectSeat(userId, { ticketId, seatNo }) {
    const ticket = await Ticket.findByPk(ticketId, {
      include: [
        {
          model: OrderPassenger,
          as: 'orderPassenger',
          include: [
            {
              model: Order,
              as: 'order'
            }
          ]
        },
        {
          model: FlightSchedule,
          as: 'schedule',
          include: [{ model: Aircraft, as: 'aircraft' }]
        }
      ]
    });
    if (!ticket) throwError('Ticket not found', 404);
    if (ticket.orderPassenger.order.user_id !== userId) throwError('Forbidden', 403);
    if (ticket.status !== 0) throwError('Ticket cannot be selected');

    // Validate seat number format
    const match = seatNo.match(/^(\d+)([A-Z])$/);
    if (!match) throwError('Invalid seat number format');
    const row = parseInt(match[1]);
    const colLetter = match[2];

    const schedule = ticket.schedule;
    const layout = parseLayout(schedule.aircraft.layout);
    let seatValid = false;
    for (const [cabin, config] of Object.entries(layout)) {
      const startRow = config.startRow || 1;
      const letters = config.letters || generateLetters(config.cols || 0);
      if (row >= startRow && row < startRow + config.rows && letters.includes(colLetter)) {
        if (cabin !== ticket.cabin_class) {
          throwError('Seat does not belong to your cabin class');
        }
        seatValid = true;
        break;
      }
    }
    if (!seatValid) throwError('Seat does not exist');

    const result = await db.sequelize.transaction(async (t) => {
      // Check if seat is already selected by another ticket on the same schedule
      const existing = await SeatSelection.findOne({
        where: { schedule_id: schedule.id, seat_no: seatNo },
        transaction: t,
        lock: true
      });
      if (existing && existing.ticket_id !== ticketId) {
        throwError('Seat already taken');
      }

      await ticket.update({ seat_no: seatNo }, { transaction: t });
      const [selection] = await SeatSelection.findOrCreate({
        where: { ticket_id: ticketId },
        defaults: { seat_no: seatNo, schedule_id: schedule.id },
        transaction: t
      });
      if (selection.seat_no !== seatNo || selection.schedule_id !== schedule.id) {
        await selection.update({ seat_no: seatNo, schedule_id: schedule.id }, { transaction: t });
      }
      return selection;
    });

    return result;
  }

  async checkIn(userId, orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: FlightSchedule,
          as: 'schedule'
        },
        {
          model: OrderPassenger,
          as: 'passengers',
          include: [
            { model: Ticket, as: 'ticket' }
          ]
        }
      ]
    });
    if (!order) throwError('Order not found', 404);
    if (order.user_id !== userId) throwError('Forbidden', 403);
    if (order.status !== 2) throwError('Order is not ready for check-in');

    const now = new Date();
    const departure = new Date(order.schedule.departure_time);
    const diffHours = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      throwError('Check-in opens 24 hours before departure');
    }

    const tickets = order.passengers.map(p => p.ticket).filter(Boolean);
    for (const ticket of tickets) {
      if (!ticket.seat_no) throwError('All passengers must select seats before check-in');
    }

    await db.sequelize.transaction(async (t) => {
      for (const ticket of tickets) {
        await ticket.update({ status: 1 }, { transaction: t });
      }
      await order.update({ status: 3 }, { transaction: t });
    });

    return { message: 'Check-in successful' };
  }
}

module.exports = new CheckinService();
