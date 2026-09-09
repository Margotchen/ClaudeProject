module.exports = (sequelize, DataTypes) => {
  const UserAddress = sequelize.define('user_address', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    receiver: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    province: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    district: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    detail_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_default: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '是否默认：1 是 0 否'
    }
  }, {
    tableName: 'user_address',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: 'update_time'
  });

  return UserAddress;
};
