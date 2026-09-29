module.exports = (sequelize, DataTypes) => {
  const FlightStatus = sequelize.define('flight_status', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1 normal, 2 delayed, 3 cancelled'
    },
    delay_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reason: {
      type: DataTypes.STRING(255)
    }
  });

  return FlightStatus;
};
