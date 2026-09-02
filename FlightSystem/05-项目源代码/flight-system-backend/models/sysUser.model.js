module.exports = (sequelize, DataTypes) => {
  const SysUser = sequelize.define('sys_user', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    phone: {
      type: DataTypes.STRING(32)
    },
    id_card: {
      type: DataTypes.STRING(32)
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1
    }
  });

  return SysUser;
};
