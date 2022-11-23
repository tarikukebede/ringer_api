const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const Ringtone = require('./models/Ringtone');
const Mringtag = require('./models/Mringtag');
const ringtonesFolder = '../data/ringtones/';

const containerClass = 'card-body';

const mainUrl = 'https://statusqueen.com/ringtones';
const downloadLinks = [];
const pages = [1, 2];

const getAudioLinks = async () => {
  console.log('getAudioLinks started');
  for (const page of pages) {
    try {
      const response = await axios.get(`${mainUrl}/${page}`);
      const $ = cheerio.load(response.data);
      $(`div.${containerClass}`).each((index, element) => {
        const item = $(element);
        let downloadLink = item.find('.audio-link a').attr('href');
        downloadLinks.push(downloadLink);
      });
    } catch (error) {
      console.log(error);
    }
  }
  console.log('getAudioLinks finished');
};

const downloadFiles = async (links) => {
  console.log('Downloading started');
  try {
    for (link of links) {
      const filename = link
        .split('#')
        .shift()
        .split('?')
        .shift()
        .split('/')
        .pop();
      await downloader(link, filename);
    }
  } catch (error) {
    console.log(error);
  }

  console.log('Downloading finished');
};

const addRingtoneToDb = () => {
  try {
    fs.readdir(ringtonesFolder, async (err, files) => {
      for (const filename of files) {
        const item = await Ringtone.upsert({
          name: filename,
          url: `https://www.cdn.halleta.com/data/ringtones/${filename}`,
        });
        const id = item[0].getDataValue('id');
        createTagRelation(1, id);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const createTagRelation = async (tid, rid) => {
  try {
    await Mringtag.create({
      tid,
      rid,
    });
  } catch (error) {
    console.log(error.response);
  }
};

async function downloader(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    if (response['status'] !== 200) return;
    const writer = fs.createWriteStream(`${ringtonesFolder}${filename}`);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {}
}

(async () => {
  await getAudioLinks();
  await downloadFiles(downloadLinks);
  //await addRingtoneToDb();
})();
