const { Sequelize, DataTypes } = require('sequelize');
const db = require('../db');

const Wallpaper = db.define('Wallpaper', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Wallpaper;
