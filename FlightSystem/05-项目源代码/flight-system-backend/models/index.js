const { Sequelize, DataTypes } = require('sequelize');
const dbConfig = require('../config/db.config');

const sequelize = new Sequelize(dbConfig);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Load models
db.SysRole = require('./sysRole.model')(sequelize, DataTypes);
db.SysUser = require('./sysUser.model')(sequelize, DataTypes);
db.Airport = require('./airport.model')(sequelize, DataTypes);
db.Aircraft = require('./aircraft.model')(sequelize, DataTypes);
db.Flight = require('./flight.model')(sequelize, DataTypes);
db.FlightSchedule = require('./flightSchedule.model')(sequelize, DataTypes);
db.SeatInventory = require('./seatInventory.model')(sequelize, DataTypes);
db.Order = require('./order.model')(sequelize, DataTypes);
db.OrderPassenger = require('./orderPassenger.model')(sequelize, DataTypes);
db.Payment = require('./payment.model')(sequelize, DataTypes);
db.Ticket = require('./ticket.model')(sequelize, DataTypes);
db.SeatSelection = require('./seatSelection.model')(sequelize, DataTypes);
db.RefundChange = require('./refundChange.model')(sequelize, DataTypes);
db.FlightStatus = require('./flightStatus.model')(sequelize, DataTypes);
db.Notification = require('./notification.model')(sequelize, DataTypes);

// Define associations
const {
  SysRole, SysUser, Airport, Aircraft, Flight, FlightSchedule,
  SeatInventory, Order, OrderPassenger, Payment, Ticket,
  SeatSelection, RefundChange, FlightStatus, Notification
} = db;

// Role - User
SysRole.hasMany(SysUser, { foreignKey: 'role_id', as: 'users' });
SysUser.belongsTo(SysRole, { foreignKey: 'role_id', as: 'role' });

// Airport - Flight
Airport.hasMany(Flight, { foreignKey: 'departure_airport_id', as: 'departingFlights' });
Airport.hasMany(Flight, { foreignKey: 'arrival_airport_id', as: 'arrivingFlights' });
Flight.belongsTo(Airport, { foreignKey: 'departure_airport_id', as: 'departureAirport' });
Flight.belongsTo(Airport, { foreignKey: 'arrival_airport_id', as: 'arrivalAirport' });

// Aircraft - FlightSchedule
Aircraft.hasMany(FlightSchedule, { foreignKey: 'aircraft_id', as: 'schedules' });
FlightSchedule.belongsTo(Aircraft, { foreignKey: 'aircraft_id', as: 'aircraft' });

// Flight - FlightSchedule
Flight.hasMany(FlightSchedule, { foreignKey: 'flight_id', as: 'schedules' });
FlightSchedule.belongsTo(Flight, { foreignKey: 'flight_id', as: 'flight' });

// FlightSchedule - SeatInventory
FlightSchedule.hasMany(SeatInventory, { foreignKey: 'schedule_id', as: 'seatInventories' });
SeatInventory.belongsTo(FlightSchedule, { foreignKey: 'schedule_id', as: 'schedule' });

// User - Order
SysUser.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(SysUser, { foreignKey: 'user_id', as: 'user' });

// FlightSchedule - Order
FlightSchedule.hasMany(Order, { foreignKey: 'schedule_id', as: 'orders' });
Order.belongsTo(FlightSchedule, { foreignKey: 'schedule_id', as: 'schedule' });

// Order - OrderPassenger
Order.hasMany(OrderPassenger, { foreignKey: 'order_id', as: 'passengers' });
OrderPassenger.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Order - Payment
Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// OrderPassenger - Ticket
OrderPassenger.hasOne(Ticket, { foreignKey: 'order_passenger_id', as: 'ticket' });
Ticket.belongsTo(OrderPassenger, { foreignKey: 'order_passenger_id', as: 'orderPassenger' });

// FlightSchedule - Ticket
FlightSchedule.hasMany(Ticket, { foreignKey: 'schedule_id', as: 'tickets' });
Ticket.belongsTo(FlightSchedule, { foreignKey: 'schedule_id', as: 'schedule' });

// Ticket - SeatSelection
Ticket.hasOne(SeatSelection, { foreignKey: 'ticket_id', as: 'seatSelection' });
SeatSelection.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });

// Order - RefundChange
Order.hasMany(RefundChange, { foreignKey: 'order_id', as: 'refundChanges' });
RefundChange.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// FlightSchedule - FlightStatus
FlightSchedule.hasOne(FlightStatus, { foreignKey: 'schedule_id', as: 'flightStatus' });
FlightStatus.belongsTo(FlightSchedule, { foreignKey: 'schedule_id', as: 'schedule' });

// User - Notification
SysUser.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(SysUser, { foreignKey: 'user_id', as: 'user' });

module.exports = db;
