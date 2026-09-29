module.exports = (sequelize, DataTypes) => {
  const WelfareApply = sequelize.define('welfare_apply', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    activity_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    total_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receiver_snapshot: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    phone_snapshot: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    address_snapshot: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    apply_status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1 待发货 2 已发货 3 已签收 4 已取消'
    },
    express_company: {
      type: DataTypes.STRING(64)
    },
    express_no: {
      type: DataTypes.STRING(64)
    },
    deliver_time: {
      type: DataTypes.DATE
    },
    sign_time: {
      type: DataTypes.DATE
    },
    feedback: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'welfare_apply',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: 'update_time',
    indexes: [
      {
        unique: true,
        fields: ['activity_id', 'user_id']
      }
    ]
  });

  return WelfareApply;
};
