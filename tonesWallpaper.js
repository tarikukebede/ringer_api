const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const Wallpaper = require('./models/Wallpaper');
const Mwtag = require('./models/Mwtag');
const Mwallpapertag = require('./models/Mwallpapertag');
const wallPapersFolder = '../data/tsw/';
const wallpapersMainUrl = 'https://www.tones7.com/wallpapers';
const mainSite = 'https://www.tones7.com/';
const containerClass = 'wallpapers';
const downloadContainer = 'details-nobg';
require('dotenv').config();
const app = express();

let wallpaperDetailPagesContainer = [];
let downloadLinksContainer = [];
let count = 0;

// const genress = [
//   'abstract',
//   'comedy',
//   'designs',
//   'holidays',
//   'love',
//   'nature',
//   'other',
//   'people',
//   'pets & animals',
//   'technology',
// ];

const genress = ['abstract', 'comedy'];

app.get('/api', async (req, res) => {
  if (count === 0) {
    count = 1;
    await getWallpagerDetailPages(genress);
    await getDownloadLinks(wallpaperDetailPagesContainer);
    await downloadWallpapers(downloadLinksContainer);
    await addRingtoneToDb(genress);
    res.send('Scrapping started');
  } else {
    res.send('Function already running');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});

const getWallpagerDetailPages = async (genres) => {
  console.log('getWallpagerDetailPages started...');
  for (const genre of genres) {
    try {
      const page = await axios.get(
        `${wallpapersMainUrl}/${genre
          .replace(/\s/g, '-')
          .replace(/&/, 'and')
          .toLowerCase()}/`
      );
      const $ = cheerio.load(page.data);
      let wallpaperDetailPages = [];
      $(`div.${containerClass}`).each((index, element) => {
        let wallpaperDetailLink = $(element).find('a').attr('href');
        if (!wallpaperDetailLink.startsWith('https')) return;
        if (wallpaperDetailLink === mainSite) return;
        wallpaperDetailPages.push(wallpaperDetailLink);
      });
      let obj = { genre, wallpaperDetailPages };
      wallpaperDetailPagesContainer.push(obj);
    } catch (error) {
      console.log(error);
    }
  }
  console.log('getWallpagerDetailPages done...');
};

const getDownloadLinks = async (containres) => {
  console.log('getDownloadLinks started...');
  for (const container of containres) {
    const { genre, wallpaperDetailPages } = container;
    let links = [];
    for (const page of wallpaperDetailPages) {
      try {
        const response = await axios.get(page);
        const $ = cheerio.load(response.data);
        $(`div.${downloadContainer}`).each((index, element) => {
          let imageLink = $(element).find('a').attr('href');
          if (!imageLink) return;
          links.push(`https://www.tones7.com${imageLink}`);
        });
      } catch (error) {
        console.log(error);
      }
    }
    downloadLinksContainer.push({ genre, links });
  }
  console.log('getDownloadLinks done...');
};

const downloadWallpapers = async (downloadsContainer) => {
  console.log('Downloading started...');
  for (const container of downloadsContainer) {
    const { genre, links } = container;
    for (link of links) {
      const filename = link
        .split('#')
        .shift()
        .split('?')
        .shift()
        .split('/')
        .pop();

      await downloader(genre, link, filename);
    }
  }
  console.log('Downloading done...');
};

const addRingtoneToDb = (genres) => {
  console.log('adding to db started...');
  for (const genre of genres) {
    try {
      const dir = `${wallPapersFolder}${genre}`;
      fs.readdir(dir, async (err, files) => {
        for (const filename of files) {
          const wallpapers = await Wallpaper.findAll({
            where: {
              name: filename,
              url: `https://www.cdn.halleta.com/data/wallpapers/${filename}`,
            },
          });

          if (wallpapers.length) continue;

          const response = await Wallpaper.upsert({
            name: filename,
            url: `https://www.cdn.halleta.com/data/wallpapers/${filename}`,
          });

          const wid = response[0].getDataValue('id');

          const mtags = await Mwtag.findAll({
            where: {
              name: genre,
            },
          });

          const tid = mtags[0].getDataValue('id');
          await createTagRelation(tid, wid);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  console.log('adding to db done...');
};

const createTagRelation = async (tid, wid) => {
  await Mwallpapertag.create({
    tid,
    wid,
  });
};

async function downloader(genre, url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    if (response.status !== 200) return;

    const dir = `${wallPapersFolder}${genre}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    const writer = fs.createWriteStream(`${dir}/${filename}`);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    return;
  }
}

// (async () => {
//   await getWallpagerDetailPages(genress);
//   await getDownloadLinks(wallpaperDetailPagesContainer);
//   await downloadWallpapers(downloadLinksContainer);
// })();

// async () => {
//   await getTags();
// };

// const genreContainerClass = 'genre_links_col';

// const getTags = async () => {
//   try {
//     console.log('Started');
//     const response = await axios.get(wallpapersMainUrl);
//     const $ = cheerio.load(response.data);
//     let tags = [];
//     $(`div.${genreContainerClass}`).each((index, element) => {
//       let tag = $(element).find('a').text().replace(/\n/g, '').toLowerCase();
//       tags.push(tag);
//     });

//     console.log(tags);
//     insertTagsInDb(tags);
//   } catch (err) {
//     console.log(err);
//   }
// };

// function insertTagsInDb(tags) {
//   tags.forEach((tag) => {
//     createTag(tag);
//   });
// }

// const createTag = async (tag) => {
//   await Mwtag.create({
//     name: tag,
//   });
// };
