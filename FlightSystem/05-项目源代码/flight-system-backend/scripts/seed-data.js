const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

const {
  SysRole, SysUser, Airport, Aircraft, Flight, FlightSchedule,
  SeatInventory, FlightStatus
} = db;

const SALT_ROUNDS = 10;

const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];
const addDays = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

const hashPassword = (pwd) => bcrypt.hashSync(pwd, SALT_ROUNDS);

async function initData() {
  // Roles
  const roleRecords = [];
  for (const roleData of [
    { role_code: 'passenger', role_name: 'Passenger', description: 'Flight search, booking, check-in' },
    { role_code: 'service', role_name: 'Customer Service', description: 'Refund and change processing' },
    { role_code: 'operator', role_name: 'Operator', description: 'Flight management' }
  ]) {
    roleRecords.push(await SysRole.create(roleData));
  }
  const roleMap = {};
  roleRecords.forEach(r => { roleMap[r.role_code] = r.id; });

  // Users
  await SysUser.bulkCreate([
    { username: 'passenger', password: hashPassword('pass123'), real_name: 'John Passenger', phone: '13800138001', id_card: '110101199001011234', role_id: roleMap['passenger'], status: 1 },
    { username: 'service', password: hashPassword('svc123'), real_name: 'Jane Service', phone: '13800138002', id_card: '110101199001021234', role_id: roleMap['service'], status: 1 },
    { username: 'operator', password: hashPassword('op123'), real_name: 'Mike Operator', phone: '13800138003', id_card: '110101199001031234', role_id: roleMap['operator'], status: 1 }
  ]);

  // Airports
  await Airport.bulkCreate([
    { airport_code: 'PEK', airport_name: 'Beijing Capital International Airport', city_name: 'Beijing' },
    { airport_code: 'SHA', airport_name: 'Shanghai Hongqiao International Airport', city_name: 'Shanghai' },
    { airport_code: 'CAN', airport_name: 'Guangzhou Baiyun International Airport', city_name: 'Guangzhou' },
    { airport_code: 'SZX', airport_name: 'Shenzhen Baoan International Airport', city_name: 'Shenzhen' },
    { airport_code: 'TFU', airport_name: 'Chengdu Tianfu International Airport', city_name: 'Chengdu' }
  ]);
  const airportRows = await Airport.findAll();
  const airportMap = {};
  airportRows.forEach(a => { airportMap[a.airport_code] = a.id; });

  // Aircraft
  await Aircraft.bulkCreate([
    { model: 'Airbus A320-200', total_seats: 150, layout: JSON.stringify({ economy: { rows: 25, cols: 6, startRow: 11 }, business: { rows: 4, cols: 4, startRow: 5 }, first: { rows: 4, cols: 4, startRow: 1 } }) },
    { model: 'Boeing 737-800', total_seats: 160, layout: JSON.stringify({ economy: { rows: 27, cols: 6, startRow: 11 }, business: { rows: 4, cols: 4, startRow: 5 }, first: { rows: 4, cols: 4, startRow: 1 } }) },
    { model: 'Airbus A330-300', total_seats: 280, layout: JSON.stringify({ economy: { rows: 40, cols: 8, startRow: 11 }, business: { rows: 6, cols: 6, startRow: 5 }, first: { rows: 4, cols: 4, startRow: 1 } }) }
  ]);
  const aircraftRows = await Aircraft.findAll();
  const aircraftIds = aircraftRows.map(a => a.id);

  // Flights (16 routes, 2 flights per city pair)
  const flightDefinitions = [
    { flight_no: 'CA1201', from: 'PEK', to: 'SHA', hour: 8, minute: 0, duration: 135 },
    { flight_no: 'CA1203', from: 'PEK', to: 'SHA', hour: 14, minute: 30, duration: 135 },
    { flight_no: 'CA1202', from: 'SHA', to: 'PEK', hour: 11, minute: 0, duration: 140 },
    { flight_no: 'CA1204', from: 'SHA', to: 'PEK', hour: 18, minute: 0, duration: 140 },
    { flight_no: 'MU5301', from: 'SHA', to: 'CAN', hour: 9, minute: 30, duration: 130 },
    { flight_no: 'MU5303', from: 'SHA', to: 'CAN', hour: 16, minute: 0, duration: 130 },
    { flight_no: 'MU5302', from: 'CAN', to: 'SHA', hour: 13, minute: 0, duration: 130 },
    { flight_no: 'MU5304', from: 'CAN', to: 'SHA', hour: 19, minute: 30, duration: 130 },
    { flight_no: 'CZ3001', from: 'CAN', to: 'PEK', hour: 14, minute: 30, duration: 195 },
    { flight_no: 'CZ3003', from: 'CAN', to: 'PEK', hour: 20, minute: 0, duration: 195 },
    { flight_no: 'CZ3002', from: 'PEK', to: 'CAN', hour: 8, minute: 30, duration: 190 },
    { flight_no: 'CZ3004', from: 'PEK', to: 'CAN', hour: 15, minute: 0, duration: 190 },
    { flight_no: 'ZH9001', from: 'SZX', to: 'TFU', hour: 10, minute: 0, duration: 155 },
    { flight_no: 'ZH9003', from: 'SZX', to: 'TFU', hour: 17, minute: 0, duration: 155 },
    { flight_no: 'ZH9002', from: 'TFU', to: 'SZX', hour: 15, minute: 0, duration: 150 },
    { flight_no: 'ZH9004', from: 'TFU', to: 'SZX', hour: 21, minute: 0, duration: 150 }
  ];

  await Flight.bulkCreate(flightDefinitions.map(f => ({
    flight_no: f.flight_no,
    departure_airport_id: airportMap[f.from],
    arrival_airport_id: airportMap[f.to],
    planned_duration: f.duration
  })));

  const flightRows = await Flight.findAll();
  const flightMap = {};
  flightRows.forEach(f => { flightMap[f.flight_no] = f.id; });

  // Schedules for the next 14 days
  const seatInventories = [];
  const flightStatuses = [];

  const cabinConfigs = {
    economy: { seats: 120, priceFactor: 1 },
    business: { seats: 20, priceFactor: 2.5 },
    first: { seats: 10, priceFactor: 5 }
  };

  const routeBasePrices = {
    'PEK-SHA': 480,
    'SHA-PEK': 480,
    'SHA-CAN': 550,
    'CAN-SHA': 550,
    'CAN-PEK': 700,
    'PEK-CAN': 700,
    'SZX-TFU': 420,
    'TFU-SZX': 420
  };

  // Track flight index per route for deterministic price variation
  const routeFlightIndex = {};

  let scheduleIndex = 0;
  for (const flightDef of flightDefinitions) {
    const routeKey = `${flightDef.from}-${flightDef.to}`;
    routeFlightIndex[routeKey] = (routeFlightIndex[routeKey] || 0);
    const flightIndex = routeFlightIndex[routeKey]++;

    for (let i = 0; i < 14; i++) {
      const date = addDays(i);
      const flightDate = formatDate(date);
      const departureTime = new Date(date);
      departureTime.setHours(flightDef.hour, flightDef.minute, 0, 0);
      const arrivalTime = new Date(departureTime.getTime() + flightDef.duration * 60000);

      const aircraftId = aircraftIds[scheduleIndex % aircraftIds.length];
      const dayOfWeek = date.getDay();
      const routeBase = routeBasePrices[routeKey] || 500;
      const basePrice = routeBase + (i * 12) + (dayOfWeek * 8) + (flightIndex * 30);

      const schedule = await FlightSchedule.create({
        flight_id: flightMap[flightDef.flight_no],
        aircraft_id: aircraftId,
        flight_date: flightDate,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        economy_price: basePrice,
        business_price: Math.round(basePrice * cabinConfigs.business.priceFactor),
        first_price: Math.round(basePrice * cabinConfigs.first.priceFactor),
        status: 1,
        delay_minutes: 0
      });

      for (const [cabin, config] of Object.entries(cabinConfigs)) {
        seatInventories.push({
          schedule_id: schedule.id,
          cabin_class: cabin,
          available_seats: config.seats,
          total_seats: config.seats
        });
      }

      flightStatuses.push({
        schedule_id: schedule.id,
        status: 1,
        delay_minutes: 0
      });

      scheduleIndex++;
    }
  }

  await SeatInventory.bulkCreate(seatInventories);
  await FlightStatus.bulkCreate(flightStatuses);

  console.log('Seed data initialized successfully');
}

async function run() {
  try {
    await initData();
    process.exit(0);
  } catch (err) {
    console.error('Seed data failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { initData };
