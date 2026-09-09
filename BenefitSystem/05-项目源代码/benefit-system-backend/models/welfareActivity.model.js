module.exports = (sequelize, DataTypes) => {
  const WelfareActivity = sequelize.define('welfare_activity', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    activity_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    activity_type: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    limit_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '状态：0 未开始 1 进行中 2 已结束 3 已停用'
    },
    create_by: {
      type: DataTypes.BIGINT
    }
  }, {
    tableName: 'welfare_activity',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: 'update_time'
  });

  return WelfareActivity;
};
