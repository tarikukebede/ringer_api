const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const _ = require('lodash');
const Mringtag = require('../models/Mringtag');
const Mrtag = require('../models/Mrtag');
const Ringtone = require('../models/Ringtone');
const authApi = require('../middlewares/authApi');
const { pageination } = require('../utils/utils');

router.get('/', authApi, async (req, res, next) => {
  const { rtag, s, page, size } = req.query;
  if (rtag || s) return next();
  //if (req.params.query) return next();
  const { limit, offset } = pageination(page, size);
  try {
    const result = await Ringtone.findAndCountAll({
      limit: limit,
      offset: offset,
    });

    res.send(result);
  } catch (e) {
    console.log(e);
    res.sendStatus(404);
  }
});

router.get('/', authApi, async (req, res, next) => {
  const { s, page, size } = req.query;
  if (!s) return next();
  console.log(s);
  let squery = s.toLocaleLowerCase().trim();
  const { limit, offset } = pageination(page, size);
  try {
    const result = await Ringtone.findAndCountAll({
      limit: limit,
      offset: offset,
      where: {
        name: { [Op.like]: '%' + squery + '%' },
      },
    });

    if (!result.count) return res.status(404).send('No items found');
    res.send(result);
  } catch (error) {
    console.log(e);
    res.status(500).send('Opps something bad happend!');
  }
});

router.get('/:id', authApi, async (req, res) => {
  try {
    const id = req.params.id;
    let results = await Ringtone.findAll({ where: { id: id } });
    if (!results.length) return res.sendStatus(404);
    res.send(results[0]);
  } catch (e) {
    console.log(e);
    res.sendStatus(404);
  }
});

//handels search by category
router.get('/', authApi, async (req, res, next) => {
  const { rtag, page, size } = req.query;

  if (!rtag) return next();
  try {
    //req.query  ===> { a: '1', b: '2' }
    const { limit, offset } = pageination(page, size);

    const mrtags = await Mrtag.findAll({
      where: {
        name: rtag,
      },
    });

    if (!mrtags.length)
      return res.send(`Sorry no ringtones were found with category ${rtag}`);

    const mringtags = await Mringtag.findAndCountAll({
      limit: limit,
      offset: offset,
      where: {
        tid: mrtags[0].getDataValue('id'),
      },
    });

    if (!mringtags.count)
      return res.send(`Sorry no ringtones were found with category ${rtag}`);

    let p = [];

    mringtags.rows.forEach(async (row) => {
      const rid = row.getDataValue('rid');
      const ringtonePromises = Ringtone.findOne({
        where: {
          id: rid,
        },
      });
      p.push(ringtonePromises);
    });

    const ringtones = await Promise.all(p);
    res.send(ringtones);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post('/', authApi, async (req, res) => {
  try {
    const { name, url } = req.body;
    const result = await Ringtone.upsert({
      name,
      url,
    });

    res.send(result[0]);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.put('/:id', authApi, async (req, res) => {
  try {
    const id = req.params.id;
    let response = await Ringtone.findAll({ where: { id: id } });
    if (!response.length) return res.sendStatus(404);

    const { name, url } = req.body;
    response = await Ringtone.update(
      { name, url },
      {
        where: {
          id: id,
        },
      }
    );

    res.send(JSON.stringify(response[0]));
  } catch (error) {}
});

router.delete('/:id', authApi, async (req, res) => {
  try {
    const id = req.params.id;
    let response = await Ringtone.findAll({ where: { id: id } });
    if (!response.length) return res.sendStatus(404);

    await Ringtone.destroy({
      where: {
        id: id,
      },
    });

    await Mringtag.destroy({
      where: {
        rid: id,
      },
    });

    res.send(JSON.stringify(1));
  } catch (error) {
    res.sendStatus(500);
  }
});

module.exports = router;
