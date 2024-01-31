var port = 80;

import puppeteer from "puppeteer";
import express from "express";
import ejs from "ejs";
const app = express();

const getCharacters = async () => {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    executablePath: '/opt/render/.cache/puppeteer/chrome/linux-121.0.6167.85/chrome-linux64/chrome.exe'
    //executablePath: 'C:/Users/Louis/.cache/puppeteer/chrome/win64-121.0.6167.85/chrome-win64/chrome.exe',
  });

  const page = await browser.newPage();
  await page.goto("https://wiki.hoyolab.com/pc/hsr/aggregate/character");
  await page.waitForSelector('.rpg-character-card-name');
  
  let prevHeight = -1;
  let maxScrolls = 100;
  let scrollCount = 0;

  while (scrollCount < maxScrolls) {
      // Scroll to the bottom of the page
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      // Wait for page load
      await page.waitForTimeout(1000);
      // Calculate new scroll height and compare
      let newHeight = await page.evaluate('document.body.scrollHeight');
      if (newHeight == prevHeight) {
          break;
      }
      prevHeight = newHeight;
      scrollCount += 1;
  }

  const characters = await page.evaluate(() => {
    const characters = [];
    const characterCards =  document.querySelectorAll('.rpg-character-card-pc');

    characterCards.forEach((element) => {
      const name = element.querySelector('.rpg-character-card-name').textContent.trim();
      const img = element.querySelector('.rpg-character-card-avatar > img').getAttribute("src");
      const rarity = element.querySelector('.rpg-character-card-star').childElementCount;
      characters.push({name, img, rarity});
    });

    return characters;
  });

  await browser.close();

  return characters;
};

var characters = [];

app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);
app.use('/images', express.static('images'))

app.get('/', function(req, res) {
  res.render('index.html');
});

app.get("/loadcharacters", async function(req, res) {
  if (characters.length == 0) {
    characters = await getCharacters();
  }
  
  res.send(characters);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})