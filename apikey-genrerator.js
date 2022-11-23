const crypto = require('crypto');
const bcrypt = require('bcrypt');

const genApiKey = async () => {
  const token = crypto.randomBytes(16).toString('hex');
  const salttoken = await bcrypt.genSalt(10);
  const salt = salttoken.replace(/[^a-zA-Z0-9]/g, '');

  return salt + token;
};

module.exports = genApiKey;
