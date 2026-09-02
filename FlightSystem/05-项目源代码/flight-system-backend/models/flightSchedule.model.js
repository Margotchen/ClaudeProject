module.exports = (sequelize, DataTypes) => {
  const FlightSchedule = sequelize.define('flight_schedule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    flight_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    aircraft_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    flight_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    departure_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    arrival_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    economy_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    business_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    first_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '0 planned, 1 normal, 2 delayed, 3 cancelled'
    },
    delay_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  return FlightSchedule;
};
