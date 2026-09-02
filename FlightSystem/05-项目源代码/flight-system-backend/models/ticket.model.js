module.exports = (sequelize, DataTypes) => {
  const Ticket = sequelize.define('ticket', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ticket_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    order_passenger_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cabin_class: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    seat_no: {
      type: DataTypes.STRING(8)
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0 unused, 1 checked-in, 2 changed, 3 refunded, 4 used'
    }
  });

  return Ticket;
};
