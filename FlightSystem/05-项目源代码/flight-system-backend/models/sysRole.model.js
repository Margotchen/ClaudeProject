module.exports = (sequelize, DataTypes) => {
  const SysRole = sequelize.define('sys_role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    role_code: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    role_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255)
    }
  });

  return SysRole;
};
