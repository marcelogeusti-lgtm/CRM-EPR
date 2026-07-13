const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeChats() {
  if (!fs.existsSync('kommo_screenshots')){
      fs.mkdirSync('kommo_screenshots');
  }

  console.log('Iniciando Puppeteer...');
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1280, height: 800 } });
  const page = await browser.newPage();

  try {
    console.log('Acessando Login...');
    await page.goto('https://contatoonlinevidracariacombr.kommo.com/', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'kommo_screenshots/chats_01_login.png' });

    console.log('Preenchendo Login...');
    const loginSelector = 'input[type="text"], input[type="email"], input[name="USER_LOGIN"]';
    const passSelector = 'input[type="password"], input[name="USER_PASSWORD"]';
    
    await page.waitForSelector(loginSelector);
    await page.type(loginSelector, 'alunidadecp@gmail.com');
    await page.type(passSelector, 'A25356258ju@@');
    await page.screenshot({ path: 'kommo_screenshots/chats_02_filled.png' });

    console.log('Clicando em Entrar...');
    await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"], input[type="submit"], .js-login-submit, button.button-input');
        if (btn) btn.click();
    });

    console.log('Aguardando autenticação...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Navigation timeout, continuing...'));
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'kommo_screenshots/chats_03_dashboard.png', fullPage: true });

    console.log('Acessando Chats Abertos...');
    await page.goto('https://contatoonlinevidracariacombr.kommo.com/chats/?filter%5Bstatus%5D%5B%5D=opened', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'kommo_screenshots/chats_04_chats_opened.png', fullPage: true });

    // Salvar o HTML para análise
    const html = await page.content();
    fs.writeFileSync('kommo_screenshots/chats_page.html', html);
    console.log('HTML salvo em kommo_screenshots/chats_page.html');

  } catch (error) {
    console.error('Erro durante o scrape:', error);
    await page.screenshot({ path: 'kommo_screenshots/chats_error.png' });
  } finally {
    console.log('Fechando...');
    await browser.close();
  }
}

scrapeChats();
