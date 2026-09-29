module.exports = (sequelize, DataTypes) => {
  const ActivityGiftRel = sequelize.define('activity_gift_rel', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    activity_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    gift_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    tableName: 'activity_gift_rel',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['activity_id', 'gift_id']
      }
    ]
  });

  return ActivityGiftRel;
};
