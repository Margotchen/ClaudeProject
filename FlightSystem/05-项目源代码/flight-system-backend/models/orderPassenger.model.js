module.exports = (sequelize, DataTypes) => {
  const OrderPassenger = sequelize.define('order_passenger', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    id_card: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    ticket_no: {
      type: DataTypes.STRING(32),
      unique: true
    }
  });

  return OrderPassenger;
};
