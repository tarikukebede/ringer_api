const { Sequelize, DataTypes } = require('sequelize');
const db = require('../db');

const Mringtag = db.define('mringtag', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
    autoIncrement: true,
  },
  tid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  rid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Mringtag;
