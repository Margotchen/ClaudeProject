module.exports = (sequelize, DataTypes) => {
  const RefundChange = sequelize.define('refund_change', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1 refund, 2 change'
    },
    reason: {
      type: DataTypes.TEXT
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    target_schedule_id: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '0 pending, 1 approved, 2 rejected'
    }
  });

  return RefundChange;
};
