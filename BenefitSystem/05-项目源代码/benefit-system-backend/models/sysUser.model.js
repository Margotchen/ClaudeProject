module.exports = (sequelize, DataTypes) => {
  const SysUser = sequelize.define('sys_user', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    user_no: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    real_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    department: {
      type: DataTypes.STRING(128)
    },
    phone: {
      type: DataTypes.STRING(32)
    },
    role_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：1 启用 0 禁用'
    }
  }, {
    tableName: 'sys_user',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: 'update_time'
  });

  return SysUser;
};
