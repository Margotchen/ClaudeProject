module.exports = (sequelize, DataTypes) => {
  const SeatInventory = sequelize.define('seat_inventory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cabin_class: {
      type: DataTypes.STRING(16),
      allowNull: false,
      comment: 'economy / business / first'
    },
    available_seats: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['schedule_id', 'cabin_class']
      }
    ]
  });

  return SeatInventory;
};
