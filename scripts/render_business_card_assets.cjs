#!/usr/bin/env node
const path = require('path');
const fs = require('fs/promises');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const cardDir = path.join(root, 'sales-kit', 'business-cards');
const source = path.join(cardDir, 'cantoni-business-card-print.html');
const frontPng = path.join(cardDir, 'cantoni-business-card-front-proof.png');
const backPng = path.join(cardDir, 'cantoni-business-card-back-proof.png');
const pdf = path.join(cardDir, 'cantoni-business-card-print.pdf');
const mooFrontPng = path.join(cardDir, 'cantoni-business-card-moo-front-proof.png');
const mooBackPng = path.join(cardDir, 'cantoni-business-card-moo-back-proof.png');
const mooPdf = path.join(cardDir, 'cantoni-business-card-moo-print.pdf');
const mooUploadPdf = path.join(cardDir, 'cantoni-business-card-moo-premium-v5-2026-05-07.pdf');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 980, height: 720 },
    deviceScaleFactor: 5
  });

  await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' });

  const front = page.locator('.card-page.front');
  const back = page.locator('.card-page.back');
  await front.screenshot({ path: frontPng });
  await back.screenshot({ path: backPng });

  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: pdf,
    width: '91mm',
    height: '61mm',
    printBackground: true,
    preferCSSPageSize: true
  });

  await page.emulateMedia({ media: 'screen' });
  await page.goto(`${pathToFileURL(source).href}?printVendor=moo`, { waitUntil: 'networkidle' });
  const mooFront = page.locator('.card-page.front');
  const mooBack = page.locator('.card-page.back');
  await mooFront.screenshot({ path: mooFrontPng });
  await mooBack.screenshot({ path: mooBackPng });

  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: mooPdf,
    width: '88mm',
    height: '59mm',
    printBackground: true,
    preferCSSPageSize: true
  });
  await fs.copyFile(mooPdf, mooUploadPdf);

  await browser.close();
  console.log(`Generated:\n- ${frontPng}\n- ${backPng}\n- ${pdf}`);
  console.log(`Generated MOO:\n- ${mooFrontPng}\n- ${mooBackPng}\n- ${mooPdf}\n- ${mooUploadPdf}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
