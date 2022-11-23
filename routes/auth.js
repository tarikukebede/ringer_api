const bcrypt = require('bcrypt');
const Joi = require('joi');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const { User } = require('../models/User');

router.post('/', async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.message);

    let user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    console.log(user);
    if (!user) return res.status(400).send('Invalid email or password.');

    const { password } = req.body;

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).send('Invalid email or password.');

    const token = user.genreateAuthToken();
    res.send(token);
  } catch (error) {
    console.log(err);
    return res.status(500).send('Something went wrong :(');
  }
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(req);
}

module.exports = router;
