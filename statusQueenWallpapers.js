const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const Wallpaper = require('./models/Wallpaper');
const Mwallpapertag = require('./models/Mwallpapertag');
const Mwtag = require('./models/Mwtag');
const wallPapersFolder = '../../cdn.halleta.com/data/ts';

let downloadLinksContainer = [];
const containerClass = 'sm-space';
const downloadStartLink = 'https://statusqueen.com/downloadmwallpaper/';
const mainUrl = 'https://statusqueen.com/hd-mobile-wallpaper';
const pages = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const getWallpaperDetaiPages = async (totalFolds) => {
  for (const fold of totalFolds) {
    try {
      const page = await axios.get(`${mainUrl}/${fold}`);
      const $ = cheerio.load(page.data);
      let links = [];
      $(`div.${containerClass}`).each((index, element) => {
        let url = $(element).find('a').attr('href');
        const id = url.split('#').shift().split('?').shift().split('/').pop();
        const link = `${downloadStartLink}${id}`;
        links.push(link);
      });
      let obj = { fold, links };
      downloadLinksContainer.push(obj);
    } catch (error) {
      console.log(error);
    }
  }

  downloadLinksContainer.length;
};

const downloadWallpapers = async (downloadsContainers) => {
  for (const container of downloadsContainers) {
    const { fold, links } = container;
    console.log(`fold - ${fold} started`);
    for (link of links) {
      const id = link.split('#').shift().split('?').shift().split('/').pop();
      const filename = `1080x1920-Wallpaper-${id}.jpg`;
      await downloader(link, filename);
    }
    console.log(`fold - ${fold} done`);
  }
};

async function downloader(url, filename) {
  const writer = fs.createWriteStream(`${wallPapersFolder}${filename}`);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

const addWallpaperToDb = (tag) => {
  try {
    fs.readdir(wallPapersFolder, async (err, files) => {
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
            name: tag,
          },
        });

        const tid = mtags[0].getDataValue('id');
        await createTagRelation(tid, wid);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

const createTagRelation = async (tid, wid) => {
  await Mwallpapertag.create({
    tid,
    wid,
  });
};

(async () => {
  await getWallpaperDetaiPages(pages);
  await downloadWallpapers(downloadLinksContainer);
  await addWallpaperToDb('mixed');
})();
