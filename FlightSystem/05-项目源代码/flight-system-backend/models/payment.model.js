module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    pay_method: {
      type: DataTypes.STRING(32),
      defaultValue: 'simulate'
    },
    pay_status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '0 failed, 1 success'
    },
    transaction_no: {
      type: DataTypes.STRING(64)
    },
    pay_time: {
      type: DataTypes.DATE
    }
  });

  return Payment;
};
