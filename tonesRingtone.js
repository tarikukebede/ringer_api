const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const Ringtone = require('./models/Ringtone');
const Mrtag = require('./models/Mrtag');
const Mringtag = require('./models/Mringtag');
const { count } = require('console');
require('dotenv').config();
const app = express();

const ringtonesMainUrl = 'https://www.tones7.com/ringtones';
const mainSite = 'https://www.tones7.com/';
const ringtonesFolder = '../data/tsr/';

const containerClass = 'ringtones_wrapper';
const downloadContainer = 'details-audio';
let soundDetailPagesContainer = [];
let downloadLinksContainer = [];
let counter = 0;

const genress = [
  'alternative',
  'ambient',
  'blues',
  'children',
  'christian',
  'cinematic',
  'classical',
  'comedy',
  'electronica',
  'folk',
  'hip hop',
  'holiday',
  'jazz',
  'latin',
  'message tones',
  'metal',
  'news & politics',
  'other',
  'pets & animals',
  'pop',
  'reggae',
  'rnb',
  'rock',
  'sayings',
  'sound effects',
  'world',
];

app.get('/api', async (req, res) => {
  if (counter === 0) {
    counter = 1;
    await getSoundDetailPages(genress);
    await getDownloadLinks(soundDetailPagesContainer);
    await downloadRingtones(downloadLinksContainer);
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

const getSoundDetailPages = async (genres) => {
  console.log('getting link started...');
  for (const genre of genres) {
    try {
      const page = await axios.get(
        `${ringtonesMainUrl}/${genre
          .replace(/\s/g, '-')
          .replace(/&/, 'and')
          .toLowerCase()}/`
      );
      const $ = cheerio.load(page.data);
      let soundDetailPages = [];
      $(`div#${containerClass}`).each((index, element) => {
        let soundDetailLink = $(element).find('a').attr('href');
        if (!soundDetailLink.startsWith('https')) return;
        if (soundDetailLink === mainSite) return;
        soundDetailPages.push(soundDetailLink);
      });

      let obj = { genre, soundDetailPages };
      soundDetailPagesContainer.push(obj);
    } catch (error) {
      console.log(error);
    }
  }
  console.log('getting link done...');
};

const getDownloadLinks = async (containres) => {
  console.log('getDownloadLinks started...');
  for (const container of containres) {
    const { genre, soundDetailPages } = container;
    let links = [];
    for (const page of soundDetailPages) {
      try {
        const response = await axios.get(page);
        const $ = cheerio.load(response.data);
        $(`div.${downloadContainer}`).each((index, element) => {
          let downloadLink = $(element).find('audio').attr('src');
          links.push(downloadLink);
        });
      } catch (error) {
        console.log(error);
      }
    }
    downloadLinksContainer.push({ genre, links });
  }
  console.log('getDownloadLinks done...');
};

const downloadRingtones = async (downloadsContainer) => {
  console.log('downloading started...');
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

  console.log('downloading done...');
};

const addRingtoneToDb = (genres) => {
  console.log('adding to db done started...');
  for (const genre of genres) {
    const dir = `${ringtonesFolder}${genre}`;
    try {
      fs.readdir(dir, async (err, files) => {
        for (const filename of files) {
          const ringtones = await Ringtone.findAll({
            where: {
              name: filename,
              url: `https://www.cdn.halleta.com/data/ringtones/${filename}`,
            },
          });

          if (ringtones.length) continue;

          const response = await Ringtone.upsert({
            name: filename,
            url: `https://www.cdn.halleta.com/data/ringtones/${filename}`,
          });

          const rid = response[0].getDataValue('id');

          const mtags = await Mrtag.findAll({
            where: {
              name: genre,
            },
          });

          const tid = mtags[0].getDataValue('id');
          await createTagRelation(tid, rid);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  console.log('adding to db done...');
};

const createTagRelation = async (tid, rid) => {
  await Mringtag.create({
    tid,
    rid,
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

    const dir = `${ringtonesFolder}${genre}`;
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
//   await getSoundDetailPages(genress);
//   await getDownloadLinks(soundDetailPagesContainer);
//   await downloadRingtones(downloadLinksContainer);
// })();

// const genreContainerClass = 'genre_links_col';

// const getTags = async () => {
//   try {
//     console.log('Started');
//     const response = await axios.get(wallpapersMainUrl);
//     const $ = cheerio.load(response.data);
//     let tags = [];
//     $(`div.${genreContainerClass}`).each((index, element) => {
//       let tag = $(element).find('a').text().replace(/\s/g, '-').replace(/&/,'and').toLowerCase();
//       tags.push(tag);
//     });

//   }catch(error){
//     console.log(error);
//   }

// } https://www.cdn.halleta.com/data/ringtones/best_wake_up_sound.mp3
//   https://www.cdn.halleta.com/data/ringtones/best_wake_up_sound.mp3

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
//   return await Mwtag.create({
//     name: tag,
//   });
// };

// (async () => {
//   await getTags();
// })();
