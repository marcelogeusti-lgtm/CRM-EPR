const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('https://www.instagram.com/reel/DZAkha1xige/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==');
  
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'kommo_screenshots/ig_1.png', fullPage: true });
  
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'kommo_screenshots/ig_2.png', fullPage: true });

  await browser.close();
}

run().catch(console.error);
