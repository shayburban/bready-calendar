import { chromium } from 'playwright';

const ROUTES = ['/', '/Home', '/FindTutors', '/AdminDashboard', '/TeacherDashboard'];
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

let total = 0;
for (const r of ROUTES) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
  await page.goto(`http://localhost:5173${r}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  console.log(`${r}: ${errs.length} errors`);
  errs.slice(0, 3).forEach((e) => console.log(`  ${e.slice(0, 150)}`));
  total += errs.length;
  page.removeAllListeners('pageerror');
  page.removeAllListeners('console');
}
await browser.close();
process.exit(total > 0 ? 1 : 0);
