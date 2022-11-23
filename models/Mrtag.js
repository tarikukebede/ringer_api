const { Sequelize, DataTypes } = require('sequelize');
const db = require('../db');

const Mrtag = db.define('mrtag', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Mrtag;
