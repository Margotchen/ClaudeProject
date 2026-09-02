module.exports = (sequelize, DataTypes) => {
  const Aircraft = sequelize.define('aircraft', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    model: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    total_seats: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    layout: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Seat layout JSON, e.g. {economy: {rows: 20, cols: 6}}'
    }
  });

  return Aircraft;
};
