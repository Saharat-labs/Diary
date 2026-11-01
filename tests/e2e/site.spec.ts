import { expect, test, type Page } from '@playwright/test';

const B = '/Claudy';
const NOTES = {
  draft: { id: '2026-10-28-d5r6t2', title: 'ไอเดียที่ยังเขียนไม่เสร็จ', category: 'ไอเดีย' },
  cover: { id: '2026-10-20-a7k2m9', title: 'ทริปทะเลวันหยุดยาว', category: 'ท่องเที่ยว' },
  long: { id: '2026-10-25-p3x8q1', title: 'สูตรผัดกะเพราที่ทำบ่อยที่สุด' },
};
const PAGES = [
  `${B}/`,
  `${B}/categories/`,
  `${B}/about/`,
  `${B}/notes/${NOTES.cover.id}/`,
  `${B}/notes/${NOTES.long.id}/`,
];

async function noHorizontalScroll(page: Page) {
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
}

test('home lists published notes newest first', async ({ page }) => {
  await page.goto(`${B}/`);
  const text = await page.locator('main').innerText();
  expect(text.indexOf(NOTES.long.title)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(NOTES.long.title)).toBeLessThan(text.indexOf(NOTES.cover.title));
  expect(text).not.toContain(NOTES.draft.title);
});

test('draft has no page and is not in categories or RSS', async ({ page, request }) => {
  const res = await request.get(`${B}/notes/${NOTES.draft.id}/`);
  expect(res.status()).toBe(404);
  await page.goto(`${B}/categories/`);
  await expect(page.locator('main')).not.toContainText(NOTES.draft.category);
  const rss = await (await request.get(`${B}/rss.xml`)).text();
  expect(rss).toContain(NOTES.cover.title);
  expect(rss).not.toContain(NOTES.draft.title);
});

test('Thai category page opens', async ({ page }) => {
  await page.goto(`${B}/notes/${NOTES.cover.id}/`);
  await page.getByRole('link', { name: NOTES.cover.category }).first().click();
  await expect(page.locator('h1')).toContainText(NOTES.cover.category);
  await expect(page.locator('main')).toContainText(NOTES.cover.title);
});

test('note images are optimised', async ({ page }) => {
  await page.goto(`${B}/notes/${NOTES.cover.id}/`);
  const srcs = await page.locator('main img').evaluateAll((els) => els.map((e) => e.getAttribute('src') ?? ''));
  expect(srcs.length).toBeGreaterThanOrEqual(3);
  for (const s of srcs) expect(s.startsWith(`${B}/_astro/`)).toBe(true);
  const srcsets = await page.locator('main img').evaluateAll((els) => els.map((e) => e.getAttribute('srcset') ?? ''));
  for (const s of srcsets) expect(s).toMatch(/ 640w/);
});

for (const path of PAGES) {
  test(`no horizontal scroll at 375px: ${path}`, async ({ page }) => {
    await page.goto(path);
    await noHorizontalScroll(page);
  });
}

test('all internal links resolve', async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const path of [`${B}/`, `${B}/categories/`, `${B}/notes/${NOTES.cover.id}/`]) {
    await page.goto(path);
    const found = await page.locator('a[href]').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    for (const h of found) {
      const u = new URL(h);
      if (u.host === 'localhost:4321') hrefs.add(u.pathname);
    }
  }
  expect(hrefs.size).toBeGreaterThan(3);
  for (const h of hrefs) {
    expect(h.startsWith(`${B}/`), h).toBe(true);
    expect((await request.get(h)).status(), h).toBe(200);
  }
});

test('single newlines render as line breaks', async ({ page }) => {
  await page.goto(`${B}/notes/${NOTES.long.id}/`);
  // two consecutive lines (no blank line) in the recipe note: Samsung Notes style
  await expect(page.locator('main article br')).not.toHaveCount(0);
  await expect(page.locator('main article p', { hasText: 'ไฟแรงตลอด' }).locator('br')).toHaveCount(1);
});

test('dates are Thai', async ({ page }) => {
  await page.goto(`${B}/`);
  await expect(page.locator('main')).toContainText('ตุลาคม 2569');
});
