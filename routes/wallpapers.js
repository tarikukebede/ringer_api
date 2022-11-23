const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const _ = require('lodash');
const Mwallpapertag = require('../models/Mwallpapertag');
const Mwtag = require('../models/Mwtag');
const Wallpaper = require('../models/Wallpaper');
const authApi = require('../middlewares/authApi');
const { pageination } = require('../utils/utils');

router.get('/sample-wallpaper', async (req, res) => {
  const { limit, offset } = pageination();
  try {
    const result = await Wallpaper.findAll({
      limit: limit,
      offset: offset,
    });

    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send('Opps - Something bad happended');
  }
});

router.get('/', authApi, async (req, res, next) => {
  const { wtag, s, page, size } = req.query;
  if (wtag || s) return next();
  //if (req.params.query) return next();
  const { limit, offset } = pageination(page, size);
  try {
    const result = await Wallpaper.findAndCountAll({
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
    const result = await Wallpaper.findAndCountAll({
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
    let results = await Wallpaper.findAll({ where: { id: id } });
    if (!results.length) return res.sendStatus(404);
    res.send(results[0]);
  } catch (e) {
    console.log(e);
    res.sendStatus(404);
  }
});

//handels search by category
router.get('/', authApi, async (req, res, next) => {
  const { wtag, page, size } = req.query;

  if (!wtag) return next();
  try {
    //req.query; // { a: '1', b: '2' }
    const { limit, offset } = pageination(page, size);

    const mwtags = await Mwtag.findAll({
      where: {
        name: wtag,
      },
    });

    if (!mwtags.length)
      return res.send(`Sorry no wallpapers were found with category ${wtag}`);

    const mwallpapertags = await Mwallpapertag.findAndCountAll({
      limit: limit,
      offset: offset,
      where: {
        tid: mwtags[0].getDataValue('id'),
      },
    });

    if (!mwallpapertags.count)
      return res.send(`Sorry no wallpapers were found with category ${wtag}`);

    let p = [];

    mwallpapertags.rows.forEach(async (row) => {
      const wid = row.getDataValue('wid');
      const wallpaperPromises = Wallpaper.findOne({
        where: {
          id: wid,
        },
      });
      p.push(wallpaperPromises);
    });

    const wallpapers = await Promise.all(p);
    res.send(wallpapers);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post('/', authApi, async (req, res) => {
  try {
    const { name, url } = req.body;
    const result = await Wallpaper.upsert({
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
    let response = await Wallpaper.findAll({ where: { id: id } });
    if (!response.length) return res.sendStatus(404);

    const { name, url } = req.body;
    response = await Wallpaper.update(
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
    let response = await Wallpaper.findAll({ where: { id: id } });
    if (!response.length) return res.sendStatus(404);

    await Wallpaper.destroy({
      where: {
        id: id,
      },
    });

    await Mwallpapertag.destroy({
      where: {
        wid: id,
      },
    });

    res.send(JSON.stringify(1));
  } catch (error) {
    res.sendStatus(500);
  }
});

module.exports = router;
