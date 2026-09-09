module.exports = (sequelize, DataTypes) => {
  const SysRole = sequelize.define('sys_role', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    role_code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '角色标识：employee/hr/admin'
    },
    role_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'sys_role',
    timestamps: true,
    createdAt: 'create_time',
    updatedAt: false
  });

  return SysRole;
};
