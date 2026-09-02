const PDFDocument = require('pdfkit');
const db = require('../models');
const { throwError } = require('../utils/response');

const {
  Order, OrderPassenger, Ticket, FlightSchedule, Flight, Airport, Aircraft, Payment
} = db;

class ItineraryService {
  async getItineraryData(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderPassenger,
          as: 'passengers',
          include: [
            {
              model: Ticket,
              as: 'ticket',
              include: [
                { model: db.SeatSelection, as: 'seatSelection' }
              ]
            }
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
                { model: Airport, as: 'departureAirport' },
                { model: Airport, as: 'arrivalAirport' }
              ]
            },
            { model: Aircraft, as: 'aircraft' }
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

  async generatePDF(orderId) {
    const order = await this.getItineraryData(orderId);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    const left = 50;
    let y = 50;

    const pageHeight = 842;
    const bottomMargin = 60;

    const checkPageBreak = (increment = 0) => {
      if (y + increment > pageHeight - bottomMargin) {
        doc.addPage();
        y = 50;
      } else {
        y += increment;
      }
    };

    doc.fontSize(22).text('Flight Itinerary / Receipt', left, y);
    checkPageBreak(40);

    doc.fontSize(12).text(`Order No: ${order.order_no}`, left, y);
    checkPageBreak(20);
    doc.text(`Issue Date: ${new Date().toLocaleString('en-US')}`, left, y);
    checkPageBreak(30);

    // Flight section
    doc.fontSize(16).text('Flight Information', left, y);
    checkPageBreak(25);

    const flight = order.schedule.flight;
    const dep = flight.departureAirport;
    const arr = flight.arrivalAirport;

    doc.fontSize(12).text(`Flight No: ${flight.flight_no}`, left, y);
    checkPageBreak(18);
    doc.text(`Route: ${dep.city_name} (${dep.airport_code}) → ${arr.city_name} (${arr.airport_code})`, left, y);
    checkPageBreak(18);
    doc.text(`Departure: ${new Date(order.schedule.departure_time).toLocaleString('en-US')}`, left, y);
    checkPageBreak(18);
    doc.text(`Arrival: ${new Date(order.schedule.arrival_time).toLocaleString('en-US')}`, left, y);
    checkPageBreak(18);
    doc.text(`Aircraft: ${order.schedule.aircraft.model}`, left, y);
    checkPageBreak(30);

    // Passenger section
    doc.fontSize(16).text('Passengers', left, y);
    checkPageBreak(25);

    order.passengers.forEach((p, idx) => {
      const ticket = p.ticket;
      const seatNo = ticket?.seatSelection?.seat_no || ticket?.seat_no || 'TBD';
      doc.fontSize(12).text(`${idx + 1}. ${p.name}  |  ID: ${p.id_card}  |  Ticket: ${ticket?.ticket_no || '-'}  |  Seat: ${seatNo}`, left, y);
      checkPageBreak(18);
    });
    checkPageBreak(12);

    // Payment section
    doc.fontSize(16).text('Payment', left, y);
    checkPageBreak(25);

    const payment = order.payments?.[0];
    doc.fontSize(12).text(`Total Amount: ¥${order.total_amount}`, left, y);
    checkPageBreak(18);
    doc.text(`Payment Status: ${payment?.pay_status === 1 ? 'Paid' : 'Unpaid'}`, left, y);
    checkPageBreak(18);
    if (payment?.transaction_no) {
      doc.text(`Transaction No: ${payment.transaction_no}`, left, y);
      checkPageBreak(18);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve({ pdfData, order });
      });
      doc.on('error', reject);
    });
  }
}

module.exports = new ItineraryService();
