const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrape() {
  if (!fs.existsSync('kommo_screenshots')){
      fs.mkdirSync('kommo_screenshots');
  }

  console.log('Iniciando Puppeteer...');
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();

  try {
    console.log('Acessando Login...');
    await page.goto('https://marcelogeusti.kommo.com/', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'kommo_screenshots/01_login.png' });

    console.log('Preenchendo Login...');
    // Procurar por input de login (username/email)
    const loginSelector = 'input[type="text"], input[type="email"], input[name="USER_LOGIN"]';
    const passSelector = 'input[type="password"], input[name="USER_PASSWORD"]';
    
    await page.waitForSelector(loginSelector);
    await page.type(loginSelector, 'marcelogeus@gmail.com');
    await page.type(passSelector, 'G@usti8826');
    await page.screenshot({ path: 'kommo_screenshots/02_filled.png' });

    console.log('Clicando em Entrar...');
    await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"], input[type="submit"], .js-login-submit, button.button-input');
        if (btn) btn.click();
    });

    console.log('Aguardando dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Navigation timeout, continuing...'));
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'kommo_screenshots/03_dashboard.png', fullPage: true });

    // Pipeline
    console.log('Acessando Pipeline...');
    await page.goto('https://marcelogeusti.kommo.com/leads/pipeline/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'kommo_screenshots/04_pipeline.png', fullPage: true });

    // Clicar em um lead se houver para ver o perfil
    console.log('Tentando abrir um lead...');
    await page.evaluate(() => {
        const lead = document.querySelector('.pipeline_leads__item');
        if (lead) lead.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'kommo_screenshots/05_lead_profile.png', fullPage: true });

    // Contacts
    console.log('Acessando Contatos...');
    await page.goto('https://marcelogeusti.kommo.com/contacts/list/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'kommo_screenshots/06_contacts.png', fullPage: true });

  } catch (error) {
    console.error('Erro durante o scrape:', error);
    await page.screenshot({ path: 'kommo_screenshots/error.png' });
  } finally {
    console.log('Fechando...');
    await browser.close();
  }
}

scrape();
