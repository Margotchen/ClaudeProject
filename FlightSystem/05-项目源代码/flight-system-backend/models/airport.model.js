module.exports = (sequelize, DataTypes) => {
  const Airport = sequelize.define('airport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    airport_code: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true
    },
    airport_name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    city_name: {
      type: DataTypes.STRING(64),
      allowNull: false
    }
  });

  return Airport;
};
