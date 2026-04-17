#!/usr/bin/env node
// One-time auth setup. Opens a real browser. You log into Base44 manually.
// Once logged in and returned to http://localhost:5173/Home, press Enter in
// this terminal — the script saves the session to .auth/state.json for the
// screenshot script to reuse.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import readline from 'node:readline/promises';

const BASE_URL   = process.env.BASE_URL || 'http://localhost:5173';
const AUTH_FILE  = resolve('.auth', 'state.json');

await mkdir('.auth', { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log(`Opening ${BASE_URL}. Log in via Base44's flow (it will redirect you).`);
console.log('When you land back on the app (any page loading normally), return here and press Enter.');
await page.goto(BASE_URL);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await rl.question('Press Enter once logged in > ');
rl.close();

await context.storageState({ path: AUTH_FILE });
console.log(`\nSaved session to ${AUTH_FILE}`);
console.log('You can now run: node scripts/screenshot.mjs');

await browser.close();
