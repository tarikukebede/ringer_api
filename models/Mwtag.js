const { Sequelize, DataTypes } = require('sequelize');
const db = require('../db');

const Mwtag = db.define('Mwtag', {
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

module.exports = Mwtag;
