const db = require('../../models');

const { Airport, Aircraft, Flight, FlightSchedule } = db;

async function sync() {
  await db.sequelize.sync({ force: true });
}

async function seedFixtures() {
  const pek = await Airport.create({ airport_code: 'PEK', airport_name: 'Beijing Capital International Airport', city_name: 'Beijing' });
  const sha = await Airport.create({ airport_code: 'SHA', airport_name: 'Shanghai Hongqiao International Airport', city_name: 'Shanghai' });

  const aircraft = await Aircraft.create({
    model: 'Test A320',
    total_seats: 150,
    layout: JSON.stringify({
      economy: { rows: 25, cols: 6, startRow: 11 },
      business: { rows: 4, cols: 4, startRow: 5 },
      first: { rows: 4, cols: 4, startRow: 1 }
    })
  });

  const flight = await Flight.create({
    flight_no: 'TEST001',
    departure_airport_id: pek.id,
    arrival_airport_id: sha.id,
    planned_duration: 135
  });

  // Create schedules for 2026-09-01 .. 2026-09-07 with known economy prices
  const dates = [
    { date: '2026-09-01', price: 520 },
    { date: '2026-09-02', price: 480 },
    { date: '2026-09-03', price: 0 },    // no schedules, will remain null
    { date: '2026-09-04', price: 550 },
    { date: '2026-09-05', price: 490 },
    { date: '2026-09-06', price: 600 },
    { date: '2026-09-07', price: 510 }
  ];

  for (const item of dates) {
    if (item.price === 0) continue;
    const departureTime = new Date(`${item.date}T08:00:00.000Z`);
    const arrivalTime = new Date(departureTime.getTime() + 135 * 60000);
    await FlightSchedule.create({
      flight_id: flight.id,
      aircraft_id: aircraft.id,
      flight_date: item.date,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      economy_price: item.price,
      business_price: Math.round(item.price * 2.5),
      first_price: Math.round(item.price * 5),
      status: 1,
      delay_minutes: 0
    });
  }

  return { pek, sha, aircraft, flight };
}

async function seedMultipleFlightsPerDay() {
  const { pek, sha, aircraft, flight } = await seedFixtures();

  // Add a second flight on 2026-09-01 with a lower price
  const flight2 = await Flight.create({
    flight_no: 'TEST002',
    departure_airport_id: pek.id,
    arrival_airport_id: sha.id,
    planned_duration: 140
  });

  const departureTime = new Date('2026-09-01T14:00:00.000Z');
  const arrivalTime = new Date(departureTime.getTime() + 140 * 60000);
  await FlightSchedule.create({
    flight_id: flight2.id,
    aircraft_id: aircraft.id,
    flight_date: '2026-09-01',
    departure_time: departureTime,
    arrival_time: arrivalTime,
    economy_price: 450,
    business_price: 1125,
    first_price: 2250,
    status: 1,
    delay_minutes: 0
  });

  // Add a cancelled schedule on 2026-09-04
  const departureTime3 = new Date('2026-09-04T20:00:00.000Z');
  const arrivalTime3 = new Date(departureTime3.getTime() + 135 * 60000);
  await FlightSchedule.create({
    flight_id: flight.id,
    aircraft_id: aircraft.id,
    flight_date: '2026-09-04',
    departure_time: departureTime3,
    arrival_time: arrivalTime3,
    economy_price: 400,
    business_price: 1000,
    first_price: 2000,
    status: 3,
    delay_minutes: 0
  });

  return { pek, sha, aircraft, flight, flight2 };
}

module.exports = { sync, seedFixtures, seedMultipleFlightsPerDay, db };
