const { User } = require('../models/User');

module.exports = async function authApi(req, res, next) {
  const key = req.query.key;
  if (!key) return res.status(401).send('Access denied.');

  const user = await User.findAll({
    where: {
      apikey: key,
    },
  });

  if (!user.length) return res.status(401).send('Access denied.');

  next();
};
