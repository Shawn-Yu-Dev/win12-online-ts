import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 800 },
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
await page.route('https://**/*', (route) => route.abort());

try {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await page.goto(`${baseUrl}/desktop.html?skip_login=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForFunction(
    () => document.getElementById('loadback')?.style.display === 'none',
    null,
    { timeout: 15000 },
  );

  assert.equal(await page.locator('#desktop').count(), 1);
  assert.equal(await page.locator('.window').count(), 30);
  assert.ok(
    await page.evaluate(() => Object.keys(window.apps || {}).length >= 25),
  );
  assert.equal(await page.locator('#notice-back.show').count(), 1);

  await page.locator('#notice .btn.main').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.openapp('calc'));
  await page.waitForFunction(() =>
    document.querySelector('.window.calc')?.classList.contains('show'),
  );
  assert.equal(await page.locator('#taskbar>a.calc').count(), 1);
  assert.equal(
    await page.evaluate(() => typeof window.appCalculator?.number_key),
    'function',
  );
  assert.equal(
    await page.evaluate(() => typeof window.apps.explorer.initHistory),
    'function',
  );
  assert.equal(
    await page.evaluate(() => typeof window.playWindowsBackground),
    'function',
  );

  await page.evaluate(() => window.hidewin('calc'));
  await page.waitForFunction(
    () => !document.querySelector('.window.calc')?.classList.contains('show'),
  );
  for (const app of ['explorer', 'edge']) {
    await page.evaluate((name) => window.openapp(name), app);
    await page.waitForFunction(
      (name) =>
        document.querySelector(`.window.${name}`)?.classList.contains('show'),
      app,
    );
  }

  await page.goto(`${baseUrl}/games/minesweeper.html`, {
    waitUntil: 'domcontentloaded',
  });
  assert.equal(await page.locator('.cell').count(), 81);
  const firstCell = page.locator('.cell').first();
  await firstCell.click({ button: 'right' });
  assert.equal(await page.locator('#mines-left').textContent(), '9');
  await firstCell.click({ button: 'right' });
  assert.equal(await page.locator('#mines-left').textContent(), '10');
  await firstCell.click();
  await page.waitForFunction(
    () => Number(document.getElementById('timer')?.textContent) >= 1,
  );
  await page.evaluate(() => {
    document
      .querySelectorAll('.cell:not(.revealed):not(.flagged)')
      .forEach((cell) =>
        cell.dispatchEvent(new MouseEvent('click', { bubbles: true })),
      );
  });
  await page.waitForFunction(
    () => document.getElementById('modal')?.style.display === 'flex',
  );
  const stoppedTime = await page.locator('#timer').textContent();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator('#timer').textContent(), stoppedTime);

  const redirectPage = await context.newPage();
  await redirectPage.goto(`${baseUrl}/index.html?to=desktop`, {
    waitUntil: 'domcontentloaded',
  });
  await redirectPage.waitForURL(/desktop\.html$/, { timeout: 15000 });
  assert.match(redirectPage.url(), /desktop\.html$/);
  await redirectPage.close();

  assert.deepEqual(pageErrors, []);
} finally {
  await browser.close();
}
