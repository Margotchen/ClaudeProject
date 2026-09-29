module.exports = (sequelize, DataTypes) => {
  const SeatSelection = sequelize.define('seat_selection', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    seat_no: {
      type: DataTypes.STRING(8),
      allowNull: false
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['schedule_id', 'seat_no']
      }
    ]
  });

  return SeatSelection;
};
