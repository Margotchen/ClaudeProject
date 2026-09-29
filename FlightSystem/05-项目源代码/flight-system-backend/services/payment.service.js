const db = require('../models');
const { throwError } = require('../utils/response');

const { Order, OrderPassenger, Payment, Ticket } = db;

function generateTransactionNo() {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `TXN${ts}${random}`;
}

function generateTicketNo(index) {
  const now = new Date();
  const ts = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TKT${ts}${random}${index}`;
}

class PaymentService {
  async simulatePayment(userId, { orderId, payMethod, simulateSuccess = true }) {
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: OrderPassenger,
          as: 'passengers'
        }
      ]
    });
    if (!order) throwError('Order not found', 404);
    if (order.user_id !== userId) throwError('Forbidden', 403);
    if (order.status !== 0) throwError('Order is not pending payment');

    // Simulate payment result
    const success = simulateSuccess !== false;

    const result = await db.sequelize.transaction(async (t) => {
      const payment = await Payment.create({
        order_id: orderId,
        amount: order.total_amount,
        pay_method: payMethod || 'simulate',
        pay_status: success ? 1 : 0,
        transaction_no: generateTransactionNo(),
        pay_time: success ? new Date() : null
      }, { transaction: t });

      if (success) {
        await order.update({
          status: 2, // ticketed
          pay_time: new Date()
        }, { transaction: t });

        // Generate tickets
        const passengers = order.passengers || [];
        for (let i = 0; i < passengers.length; i++) {
          const p = passengers[i];
          const existingTicket = await Ticket.findOne({ where: { order_passenger_id: p.id } });
          if (!existingTicket) {
            const ticketNo = generateTicketNo(i);
            await Ticket.create({
              ticket_no: ticketNo,
              order_passenger_id: p.id,
              schedule_id: order.schedule_id,
              cabin_class: order.cabin_class,
              status: 0
            }, { transaction: t });
            await p.update({ ticket_no: ticketNo }, { transaction: t });
          }
        }
      }

      return { payment, success };
    });

    return result;
  }

  async getPaymentStatus(orderId) {
    const payment = await Payment.findOne({
      where: { order_id: orderId },
      order: [['createdAt', 'DESC']]
    });
    if (!payment) throwError('Payment not found', 404);
    return payment;
  }
}

module.exports = new PaymentService();
