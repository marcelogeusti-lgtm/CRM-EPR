const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('https://marcelogeusti.kommo.com/');
  
  // Wait for login form
  await page.waitForSelector('input[name="USER_LOGIN"]');
  
  await page.type('input[name="USER_LOGIN"]', 'marcelogeus@gmail.com');
  await page.type('input[name="USER_PASSWORD"]', 'G@usti8826');
  
  // Click login
  await page.evaluate(() => {
     document.querySelector('.js-login-submit, button[type="submit"], input[type="submit"]').click();
  });
  
  console.log("Aguardando login completo (10s)...");
  await new Promise(r => setTimeout(r, 10000));
  
  await page.screenshot({ path: 'kommo_screenshots/10_dashboard_real.png', fullPage: true });

  await page.goto('https://marcelogeusti.kommo.com/leads/pipeline/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: 'kommo_screenshots/11_pipeline_real.png', fullPage: true });

  await browser.close();
}

run().catch(console.error);
