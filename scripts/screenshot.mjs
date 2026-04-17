#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUT_DIR  = process.env.OUT_DIR  || 'baseline';

const ROUTES = [
  '/',
  '/Home',
  '/FindTutors',
  '/MyProfile',
  '/AdminDashboard',
  '/TeacherRegistration',
  '/PostRequirement',
  '/TeacherDashboard',
  '/StudentDashboard',
  '/LiveSession',
  '/BookingCalendar',
  '/InputSystemTest',
  '/TeacherCalendar',
  '/TeacherCalendarWeekly',
  '/AdminRoleManagement',
  '/AdminAnalytics',
  '/AdminPricingManagement',
  '/AdminPendingApprovals',
  '/AdminContentManagement',
  '/AdminSystemDesign',
  '/UserSearchInsights',
  '/TeacherInbox',
  '/TeacherChat',
  '/TeacherTasks',
  '/TeacherStatistics',
  '/TeacherFinance',
  '/TeacherSettings',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390,  height: 844 },
];

const slug = (r) => (r === '/' ? 'root' : r.replace(/^\//, '').replace(/\//g, '_'));

async function shoot(page, route, viewport) {
  const url = `${BASE_URL}${route}`;
  const out = resolve(OUT_DIR, `${slug(route)}.${viewport.name}.png`);
  const result = { route, viewport: viewport.name, url, out, status: 'ok', error: null };
  try {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch {
      // networkidle may never fire if SDK keeps polling; ignore
    }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: out, fullPage: true });
  } catch (e) {
    result.status = 'error';
    result.error = e.message;
    try {
      await page.screenshot({ path: out, fullPage: true });
    } catch {}
  }
  return result;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const { existsSync } = await import('node:fs');
  const storageState = existsSync('.auth/state.json') ? '.auth/state.json' : undefined;
  const context = await browser.newContext({ deviceScaleFactor: 1, storageState });

  // If no stored session, mock Base44 responses at the network level so the
  // SDK gets a successful User.me() and stops redirecting to base44.app/login.
  // This is test-scaffolding only — source files untouched.
  if (!storageState) {
    const mockUser = { id: 'baseline-user', email: 'baseline@local', full_name: 'Baseline', role: 'admin' };
    await context.route(/base44\.(app|com)\/api\/.*\/entities\/User\/me/i, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) }));
    await context.route(/base44\.(app|com)\/api\//i, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await context.route(/base44\.(app|com)\/(login|logout)/i, (r) => r.abort());
  }
  const page = await context.newPage();

  console.log(`Screenshotting ${ROUTES.length} routes x ${VIEWPORTS.length} viewports against ${BASE_URL}`);
  const results = [];
  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      const r = await shoot(page, route, viewport);
      const tag = r.status === 'ok' ? 'OK ' : 'ERR';
      console.log(`[${tag}] ${viewport.name.padEnd(7)} ${route}${r.error ? `  (${r.error.slice(0, 80)})` : ''}`);
      results.push(r);
    }
  }
  await browser.close();

  const errs = results.filter((r) => r.status === 'error').length;
  console.log(`\nDone. ${results.length - errs}/${results.length} successful. Output: ${resolve(OUT_DIR)}`);
  if (errs) process.exitCode = 1;
}

main();
