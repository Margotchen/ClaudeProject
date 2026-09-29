const ExcelJS = require('exceljs');
const { format } = require('fast-csv');
const db = require('../models');

const { Order, FlightSchedule, Flight, Airport, OrderPassenger, Payment } = db;

class ExportService {
  async getOrdersForExport() {
    const orders = await Order.findAll({
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
        { model: OrderPassenger, as: 'passengers' },
        { model: Payment, as: 'payments' }
      ],
      order: [['createdAt', 'DESC']]
    });
    return orders;
  }

  async getFlightsForExport() {
    const flights = await Flight.findAll({
      include: [
        { model: Airport, as: 'departureAirport', attributes: ['airport_code', 'city_name'] },
        { model: Airport, as: 'arrivalAirport', attributes: ['airport_code', 'city_name'] }
      ],
      order: [['flight_no', 'ASC']]
    });
    return flights;
  }

  async exportOrders(formatType) {
    const orders = await this.getOrdersForExport();
    const rows = orders.map(o => ({
      'Order No': o.order_no,
      'Flight No': o.schedule?.flight?.flight_no,
      'Route': `${o.schedule?.flight?.departureAirport?.airport_code} → ${o.schedule?.flight?.arrivalAirport?.airport_code}`,
      'Cabin': o.cabin_class,
      'Passengers': o.passengers?.length || 0,
      'Amount': o.total_amount,
      'Status': o.status,
      'Create Time': o.createdAt
    }));

    if (formatType === 'csv') {
      return this.toCsv(rows);
    }
    return this.toExcel(rows, 'Orders');
  }

  async exportFlights(formatType) {
    const flights = await this.getFlightsForExport();
    const rows = flights.map(f => ({
      'Flight No': f.flight_no,
      'Departure': `${f.departureAirport?.airport_code} - ${f.departureAirport?.city_name}`,
      'Arrival': `${f.arrivalAirport?.airport_code} - ${f.arrivalAirport?.city_name}`,
      'Duration (min)': f.planned_duration
    }));

    if (formatType === 'csv') {
      return this.toCsv(rows);
    }
    return this.toExcel(rows, 'Flights');
  }

  toCsv(rows) {
    return new Promise((resolve, reject) => {
      const rowsStream = format({ headers: rows.length > 0 ? Object.keys(rows[0]) : [], writeHeaders: true });
      const chunks = [];
      rowsStream.on('data', chunk => chunks.push(chunk));
      rowsStream.on('end', () => resolve(Buffer.concat(chunks)));
      rowsStream.on('error', reject);
      rows.forEach(row => rowsStream.write(Object.values(row)));
      rowsStream.end();
    });
  }

  async toExcel(rows, sheetName) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    if (rows.length > 0) {
      worksheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
      rows.forEach(row => worksheet.addRow(row));
    }
    return workbook.xlsx.writeBuffer();
  }
}

module.exports = new ExportService();
