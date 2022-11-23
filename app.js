const express = require('express');
const ringtones = require('./routes/ringtones');
const users = require('./routes/users');
const wallpapers = require('./routes/wallpapers');
const auth = require('./routes/auth');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', auth);
app.use('/api/ringtones', ringtones);
app.use('/api/wallpapers', wallpapers);
app.use('/api/users', users);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
