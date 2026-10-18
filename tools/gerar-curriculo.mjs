// Gera curriculoLuizHenrique.pdf a partir de tools/curriculo.html.
// Roda de uma pasta com Playwright instalado, ex.:
//   cd ~/conteudo/carrossel-estudio && node ~/infra/luizhenriquedevbr/tools/gerar-curriculo.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Playwright vem da pasta onde o comando roda, não deste repositório.
const { chromium } = createRequire(path.join(process.cwd(), '/'))('playwright');

const tools = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.join(tools, 'curriculo.html'), { waitUntil: 'networkidle' });
await page.pdf({ path: path.join(tools, '..', 'curriculoLuizHenrique.pdf'), preferCSSPageSize: true, printBackground: true });
await browser.close();
console.log('ok');
