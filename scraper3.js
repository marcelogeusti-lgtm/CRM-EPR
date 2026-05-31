const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();
  
  await page.goto('https://marcelogeusti.kommo.com/');
  
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'marcelogeus@gmail.com');
  
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'G@usti8826');
  
  await page.evaluate(() => {
     const btns = Array.from(document.querySelectorAll('button'));
     const loginBtn = btns.find(b => b.innerText.toLowerCase().includes('login') || b.innerText.toLowerCase().includes('entrar'));
     if(loginBtn) loginBtn.click();
     else document.querySelector('form').submit();
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
