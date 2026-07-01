// Objective fold check for the phone Teacher Discovery summary.
// Renders /FindTutors at several phone viewports and reports whether the
// Experience row, Cancellation row and "Scroll for full profile" cue are all
// within the card's visible scroll viewport at scrollTop=0 (i.e. above the fold).
//
// Usage: BASE_URL=http://localhost:4173 node scripts/measure-discovery-fold.mjs
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4173';
const VIEWPORTS = [
  { name: 'tall-390x844', width: 390, height: 844 },
  { name: 'iphoneX-375x812', width: 375, height: 812 },
  { name: 'iphone8-375x667', width: 375, height: 667 },
  { name: 'android-360x640', width: 360, height: 640 },
  // toolbar-visible first-paint simulations (dvh shorter than the device's CSS height)
  { name: 'toolbar-390x780', width: 390, height: 780 },
  { name: 'toolbar-360x600', width: 360, height: 600 },
];

const browser = await chromium.launch();
let anyFail = false;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/FindTutors`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dc-noscrollbar', { timeout: 15000 });
    // dismiss the one-time coachmark overlay if present
    try { await page.getByText('Tap anywhere to start').click({ timeout: 1500 }); } catch { /* no coach */ }
    await page.waitForTimeout(250);

    const scroller = page.locator('.dc-noscrollbar').first();
    await scroller.evaluate((el) => { el.scrollTop = 0; });
    const sBox = await scroller.boundingBox();
    const foldBottom = sBox.y + sBox.height;
    // horizontal overflow guard (language row / any summary content spilling the card)
    const hOverflow = await scroller.evaluate((el) => el.scrollWidth - el.clientWidth);

    const bottomOf = async (text) => {
      const loc = page.getByText(text, { exact: false }).first();
      const b = await loc.boundingBox().catch(() => null);
      return b ? b.y + b.height : null;
    };
    const expB = await bottomOf('Experience');
    const cancB = await bottomOf('Cancellation');
    const cueB = await bottomOf('Scroll for full profile');
    const within = (b) => b != null && b <= foldBottom + 1;

    const res = {
      vp: vp.name,
      foldBottom: Math.round(foldBottom),
      experienceBottom: expB && Math.round(expB),
      cancellationBottom: cancB && Math.round(cancB),
      cueBottom: cueB && Math.round(cueB),
      experienceVisible: within(expB),
      cancellationVisible: within(cancB),
      cueVisible: within(cueB),
      hOverflow,
      noHOverflow: hOverflow <= 1,
    };
    const ok = res.experienceVisible && res.cancellationVisible && res.cueVisible && res.noHOverflow;
    if (!ok) anyFail = true;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${JSON.stringify(res)}`);
  } catch (err) {
    anyFail = true;
    console.log(`ERROR ${vp.name}: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

await browser.close();
process.exit(anyFail ? 1 : 0);
