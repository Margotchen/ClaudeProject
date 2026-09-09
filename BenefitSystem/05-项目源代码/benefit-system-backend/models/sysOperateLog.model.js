module.exports = (sequelize, DataTypes) => {
  const SysOperateLog = sequelize.define('sys_operate_log', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.BIGINT
    },
    username: {
      type: DataTypes.STRING(64)
    },
    module: {
      type: DataTypes.STRING(64)
    },
    action: {
      type: DataTypes.STRING(64)
    },
    description: {
      type: DataTypes.TEXT
    },
    ip: {
      type: DataTypes.STRING(64)
    },
    params: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'sys_operate_log',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: false
  });

  return SysOperateLog;
};
