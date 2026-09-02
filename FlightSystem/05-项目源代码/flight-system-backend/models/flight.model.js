module.exports = (sequelize, DataTypes) => {
  const Flight = sequelize.define('flight', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    flight_no: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true
    },
    departure_airport_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    arrival_airport_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    planned_duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Planned flight duration in minutes'
    }
  });

  return Flight;
};
