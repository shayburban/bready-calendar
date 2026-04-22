import { chromium } from 'playwright';

const PORT = process.env.PORT || '5177';
const ROUTES = ['/TeacherTasks?role=teacher&uid=u-sarah'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

let total = 0;
for (const r of ROUTES) {
  const errs = [];
  const onErr = (e) => errs.push(`pageerror: ${e.message}`);
  const onConsole = (m) => {
    if (m.type() === 'error') errs.push(`console: ${m.text()}`);
  };
  page.on('pageerror', onErr);
  page.on('console', onConsole);
  await page.goto(`http://localhost:${PORT}${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: `role-screens/tasks-${r.split('?')[0].replace(/[^a-z0-9]/gi, '_')}.png`,
    fullPage: true,
  });
  const h1 = await page.locator('h1').first().innerText().catch(() => '');
  console.log(`${r}  →  h1="${h1}"  errors=${errs.length}`);
  errs.slice(0, 5).forEach((e) => console.log(`  ${e.slice(0, 200)}`));
  total += errs.length;
  page.off('pageerror', onErr);
  page.off('console', onConsole);
}
await browser.close();
process.exit(total > 0 ? 1 : 0);
