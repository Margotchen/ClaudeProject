const { Op, Sequelize } = require('sequelize');
const db = require('../models');

const {
  FlightSchedule, Flight, Airport, Order, RefundChange
} = db;

function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start, end };
}

function getRecentDays(days) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split('T')[0]);
  }
  return result;
}

class StatisticsService {
  async getDashboard() {
    const { start: todayStart, end: todayEnd } = getTodayRange();

    const todayFlightCount = await FlightSchedule.count({
      where: {
        flight_date: todayStart.toISOString().split('T')[0]
      }
    });

    const todayOrderCount = await Order.count({
      where: {
        createdAt: { [Op.between]: [todayStart, todayEnd] }
      }
    });

    const todayRevenue = await Order.sum('total_amount', {
      where: {
        status: { [Op.in]: [1, 2, 3, 4] },
        createdAt: { [Op.between]: [todayStart, todayEnd] }
      }
    }) || 0;

    const pendingRefundCount = await RefundChange.count({
      where: { status: 0 }
    });

    // Recent 7 days order trend
    const recentDays = getRecentDays(7);
    const trend = [];
    for (const day of recentDays) {
      const dayStart = new Date(`${day}T00:00:00`);
      const dayEnd = new Date(`${day}T23:59:59`);
      const count = await Order.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] }
        }
      });
      trend.push({ date: day, count });
    }

    // Cabin sales distribution (paid or ticketed)
    const cabinSales = await Order.findAll({
      attributes: ['cabin_class', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
      where: { status: { [Op.in]: [1, 2, 3, 4] } },
      group: ['cabin_class'],
      raw: true
    });

    // Top 5 routes
    const topRoutes = await Order.findAll({
      attributes: [
        [Sequelize.col('schedule.flight.departureAirport.airport_code'), 'origin'],
        [Sequelize.col('schedule.flight.arrivalAirport.airport_code'), 'destination'],
        [Sequelize.fn('COUNT', Sequelize.col('order.id')), 'count']
      ],
      include: [
        {
          model: FlightSchedule,
          as: 'schedule',
          attributes: [],
          include: [
            {
              model: Flight,
              as: 'flight',
              attributes: [],
              include: [
                { model: Airport, as: 'departureAirport', attributes: [] },
                { model: Airport, as: 'arrivalAirport', attributes: [] }
              ]
            }
          ]
        }
      ],
      where: { status: { [Op.in]: [1, 2, 3, 4] } },
      group: ['schedule.flight.departureAirport.airport_code', 'schedule.flight.arrivalAirport.airport_code'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('order.id')), 'DESC']],
      limit: 5,
      raw: true
    });

    return {
      todayFlightCount,
      todayOrderCount,
      todayRevenue,
      pendingRefundCount,
      trend,
      cabinSales: cabinSales.map(c => ({
        cabinClass: c.cabin_class,
        count: parseInt(c.count)
      })),
      topRoutes: topRoutes.map(r => ({
        route: `${r.origin} → ${r.destination}`,
        count: parseInt(r.count)
      }))
    };
  }
}

module.exports = new StatisticsService();
