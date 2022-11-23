const { Sequelize, DataTypes } = require('sequelize');
const db = require('../db');

const Mwallpapertag = db.define('MWallpapertag', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
  },
  tid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  wid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Mwallpapertag;
