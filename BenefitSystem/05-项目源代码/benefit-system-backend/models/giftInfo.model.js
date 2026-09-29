module.exports = (sequelize, DataTypes) => {
  const GiftInfo = sequelize.define('gift_info', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    gift_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    image_url: {
      type: DataTypes.STRING(255)
    },
    specification: {
      type: DataTypes.STRING(255)
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    warn_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    supplier_name: {
      type: DataTypes.STRING(128)
    },
    supplier_contact: {
      type: DataTypes.STRING(64)
    },
    supplier_phone: {
      type: DataTypes.STRING(32)
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1 上架 0 下架'
    }
  }, {
    tableName: 'gift_info',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: 'update_time'
  });

  return GiftInfo;
};
