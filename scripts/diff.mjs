#!/usr/bin/env node
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const BASELINE = process.env.BASELINE || 'baseline';
const CURRENT  = process.env.CURRENT  || 'current';
const DIFF_OUT = process.env.DIFF_OUT || 'diff';
const THRESHOLD = Number(process.env.PIXEL_THRESHOLD ?? 0.1);

async function loadPng(path) {
  const buf = await readFile(path);
  return PNG.sync.read(buf);
}

async function main() {
  await mkdir(DIFF_OUT, { recursive: true });
  const files = (await readdir(BASELINE)).filter((f) => f.endsWith('.png')).sort();
  if (!files.length) {
    console.error(`No baseline PNGs in ${BASELINE}/`);
    process.exit(2);
  }

  let totalDiff = 0;
  let failed = 0;
  const report = [];

  for (const file of files) {
    const a = resolve(BASELINE, file);
    const b = resolve(CURRENT, file);
    try {
      const [imgA, imgB] = await Promise.all([loadPng(a), loadPng(b)]);
      if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
        console.log(`[SIZE] ${file} baseline=${imgA.width}x${imgA.height} current=${imgB.width}x${imgB.height}`);
        failed++;
        report.push({ file, diff: 'size-mismatch' });
        continue;
      }
      const diff = new PNG({ width: imgA.width, height: imgA.height });
      const px = pixelmatch(imgA.data, imgB.data, diff.data, imgA.width, imgA.height, { threshold: THRESHOLD });
      totalDiff += px;
      if (px > 0) {
        failed++;
        await writeFile(resolve(DIFF_OUT, file), PNG.sync.write(diff));
        console.log(`[DIFF] ${file}  ${px} px differ`);
      } else {
        console.log(`[OK  ] ${file}`);
      }
      report.push({ file, diff: px });
    } catch (e) {
      failed++;
      console.log(`[FAIL] ${file}  ${e.message}`);
      report.push({ file, diff: 'load-error', error: e.message });
    }
  }

  await writeFile(resolve(DIFF_OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\nTotal pixel diff: ${totalDiff}. Failing images: ${failed}/${files.length}`);
  if (failed) process.exitCode = 1;
}

main();
