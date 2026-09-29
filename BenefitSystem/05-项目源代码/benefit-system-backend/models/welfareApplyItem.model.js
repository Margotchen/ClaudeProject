module.exports = (sequelize, DataTypes) => {
  const WelfareApplyItem = sequelize.define('welfare_apply_item', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    apply_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    gift_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    gift_name_snapshot: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    spec_snapshot: {
      type: DataTypes.STRING(255)
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'welfare_apply_item',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: false
  });

  return WelfareApplyItem;
};
