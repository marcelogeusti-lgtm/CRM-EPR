const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  if (!fs.existsSync('kommo_screenshots')) fs.mkdirSync('kommo_screenshots');

  console.log("Conectando ao Chrome local...");
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
  
  // Pegar a aba visível (geralmente a primeira aba ativa)
  const targets = await browser.targets();
  const pages = await browser.pages();
  
  // A aba atual do usuário
  let activePage = pages.find(p => !p.url().includes('devtools'));
  if (pages.length > 0) activePage = pages[pages.length - 1]; // pega a última aba aberta
  
  if (!activePage) {
      console.log("Nenhuma página ativa encontrada!");
      process.exit(1);
  }

  const url = await activePage.url();
  console.log("Página atual identificada:", url);
  
  // Vamos garantir que a página carregou as coisas dinâmicas
  await activePage.evaluate(() => window.scrollBy(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));
  await activePage.evaluate(() => window.scrollBy(0, -document.body.scrollHeight));
  
  const timestamp = Date.now();
  await activePage.screenshot({ path: `kommo_screenshots/inspection_${timestamp}.png`, fullPage: true });

  // Tentar extrair o HTML principal para análise (tirar scripts e styles para caber)
  const domContent = await activePage.evaluate(() => {
     const clone = document.body.cloneNode(true);
     const scripts = clone.querySelectorAll('script, style, svg, path, link, meta, iframe');
     scripts.forEach(s => s.remove());
     return clone.innerText.substring(0, 3000); // pegar os primeiros 3000 chars de texto para entender o contexto
  });

  fs.writeFileSync(`kommo_screenshots/dom_${timestamp}.txt`, `URL: ${url}\n\nTEXT:\n${domContent}`);

  console.log(`Inspeção concluída! Screenshot: inspection_${timestamp}.png`);
  
  browser.disconnect();
}

run().catch(console.error);
