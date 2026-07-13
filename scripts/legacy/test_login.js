const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to http://localhost:3000/login');
  await page.goto('http://localhost:3000/login');

  console.log('Clicking login button...');
  await page.click('button[type="submit"]');

  console.log('Waiting for 3 seconds to see what happens...');
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log('Final URL:', url);

  const buttonText = await page.textContent('button[type="submit"]');
  console.log('Button text:', buttonText);

  await browser.close();
})();
