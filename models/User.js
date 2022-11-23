const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { DataTypes } = require('sequelize');
const db = require('../db');
require('dotenv').config();
const Joi = require('joi');

const generateApiKey = async () => {
  const token = crypto.randomBytes(16).toString('hex');
  const salttoken = await bcrypt.genSalt(10);
  const salt = salttoken.replace(/[^a-zA-Z0-9]/g, '');
  return salt + token;
};

const User = db.define('user', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    primaryKey: true,
    autoIncrement: true,
  },

  username: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  apiKey: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: generateApiKey(),
  },
});

function validateUser(user) {
  const schema = Joi.object({
    username: Joi.string().min(5).max(255).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    apiKey: Joi.string().min(5).max(255),
  });

  return schema.validate(user);
}

User.prototype.genreateAuthToken = function () {
  const token = jwt.sign(
    {
      id: this.id,
      username: this.username,
      email: this.email,
      apiKey: this.apiKey,
    },
    process.env.JWTPRIVATEKEY
  );
  return token;
};

module.exports.User = User;
module.exports.validate = validateUser;
