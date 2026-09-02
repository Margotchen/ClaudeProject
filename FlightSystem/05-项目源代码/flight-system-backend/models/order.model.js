module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    user_id: {
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
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0 pending, 1 paid, 2 ticketed, 3 checked-in, 4 changed, 5 refunded, 6 cancelled'
    },
    contact_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    contact_phone: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    pay_time: {
      type: DataTypes.DATE
    }
  });

  return Order;
};
