const { Sequelize } = require('sequelize');
require('dotenv').config();

//a service that creates connection to the database
// const pool = mysql.createPool({
//   connectionLimit: 10,
//   host: process.env.HOST,
//   user: process.env.USER,
//   password: process.env.PASSWORD,
//   database: process.env.DATABASE,
// });

const pool = new Sequelize(
  process.env.DATABASE,
  process.env.USER,
  process.env.PASSWORD,
  {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    logging: false,
  }
);

//Test DB
pool
  .authenticate()
  .then(() => {
    console.log('Database connected...');
  })
  .catch((err) => console.log('Error: ' + err));

module.exports = pool;
// let ringerdb = {};

// ringerdb.all = () => {
//   return new Promise((resolve, reject) => {
//     pool.query('SELECT * FROM ringtones', (error, results) => {
//       if (error) {
//         return reject(error);
//       }

//       return resolve(results);
//     });
//   });
// };

// ringerdb.one = (id) => {
//   return new Promise((resolve, reject) => {
//     pool.query(
//       `SELECT * FROM ringtones WHERE id = ?`,
//       [id],
//       (error, results) => {
//         if (error) {
//           return reject(error);
//         }

//         return resolve(results[0]);
//       }
//     );
//   });
// };

// ringerdb.create = ({ title, url, category }) => {
//   return new Promise((resolve, reject) => {
//     pool.query(
//       `SELECT * FROM ringtones WHERE id = ?`,
//       [id],
//       (error, results) => {
//         if (error) {
//           return reject(error);
//         }

//         return resolve(results[0]);
//       }
//     );
//   });
// };

// module.exports = ringerdb;
