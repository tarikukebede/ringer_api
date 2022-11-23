const _ = require('lodash');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const genApiKey = require('../apikey-genrerator');
const { User, validate } = require('../models/User');

router.get('/me', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
  });
  res.send(user);
});

router.post('/', async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.message);

  let user = await User.findOne({
    where: {
      email: req.body.email,
    },
  });

  if (user) return res.status(400).send('Users already registered');

  const { username, email, password } = req.body;

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);
  const apiKey = await genApiKey();

  user = await User.create({
    username,
    email,
    password: hashed,
    apiKey,
  });

  const token = user.genreateAuthToken();
  console.log(token);
  user = _.pick(user, ['id', 'username', 'email']);
  res
    .header('x-auth-token', token) //custome header
    .header('access-control-expose-headers', 'x-auth-token')
    .send(user); //standard header for whitelisting the custom header
});

module.exports = router;
