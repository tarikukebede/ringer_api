const jwt = require('jsonwebtoken');

const pagniation = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? page * limit : 0;

  return { limit, offset };
};

const genrateAuthToken = ({ id }) => {
  const token = jwt.sign({ id }, process.env.JWTPRIVATEKEY);
  return token;
};

module.exports.pageination = pagniation;
module.exports.genAuthToken = genrateAuthToken;
