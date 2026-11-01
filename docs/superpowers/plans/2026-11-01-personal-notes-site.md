# เว็บบันทึกส่วนตัว — แผนการสร้าง

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เว็บบันทึกสาธารณะภาษาไทยบน GitHub Pages ที่เจ้าของเขียนพร้อมรูปจากมือถือผ่าน Sveltia CMS ได้ ฟรีทั้งหมด

**Architecture:** Astro สร้างเว็บ static จากไฟล์ Markdown ใน `src/content/notes/` และรูปใน `src/assets/notes/`; GitHub Actions build แล้ว deploy ขึ้น Pages ทุกครั้งที่ push เข้า `main`; Sveltia CMS ที่ `/admin/` commit ไฟล์เข้า repo โดยตรง (ล็อกอินด้วย Personal Access Token)

**Tech Stack:** Astro 5, TypeScript, `@astrojs/rss`, Vitest, `@playwright/test`, Sveltia CMS (โหลดจาก unpkg), GitHub Actions (`withastro/action`)

**Spec:** `docs/superpowers/specs/2026-11-01-personal-notes-site-design.md`

## Global Constraints

- ค่าใช้จ่าย 0 บาท — ห้ามใช้บริการที่มีค่าใช้จ่ายหรือต้องตั้ง server เพิ่ม
- `site: 'https://saharatyokthuan.github.io'`, `base: '/Claudy'`, `trailingSlash: 'always'` — ลิงก์ภายในทุกจุดต้องผ่าน `import.meta.env.BASE_URL`
- ข้อความบนเว็บทั้งหมดเป็นภาษาไทย; `<html lang="th">`; ฟอนต์ไทยจาก Google Fonts (Noto Sans Thai หรือ Sarabun)
- ชื่อเว็บชั่วคราว: `บันทึกของฉัน` (อยู่ที่ `src/site.config.ts` ที่เดียว)
- mobile-first: ที่ความกว้าง 375px ต้องไม่มีการเลื่อนแนวนอน; รองรับโหมดมืดผ่าน `prefers-color-scheme`
- บันทึกที่ `draft: true` ต้องไม่ปรากฏที่ใดเลยบนเว็บที่ build ออกมา
- หน้าแรกแบ่งหน้าละ 20 บันทึก
- ห้าม push เข้า `main` โดยไม่ได้รับอนุญาตจากเจ้าของ งานทั้งหมดอยู่บน `claude/epic-hopper-o3zda7`

## Review Focus

1. **ชื่อหมวดภาษาไทยและมีเว้นวรรค** (เช่น `ท่องเที่ยว ญี่ปุ่น`) — ต้องได้ URL หมวดที่เปิดได้จริง และสองชื่อที่ต่างกันแค่ตัวพิมพ์/ช่องว่างหัวท้ายต้องรวมเป็นหมวดเดียว → ทดสอบใน Task 2 (`categorySlug`, `groupByCategory`) และ Task 3 (e2e เปิดหน้าหมวดภาษาไทย)
2. **บันทึกฉบับร่าง** — ต้องไม่โผล่ในหน้าแรก, หน้าหมวด, จำนวนนับหมวด, RSS และไม่มีหน้าของตัวเอง → ทดสอบใน Task 3
3. **ข้อความไทยยาวไม่มีช่องว่าง / URL ยาวในเนื้อหา** — ต้องตัดบรรทัด ไม่ดันหน้าเว็บให้กว้างเกิน 375px → sample note ใน Task 5 + e2e overflow ใน Task 3
4. **บันทึกไม่มีรูป cover และบันทึกที่มีหลายรูปในเนื้อ** — การ์ดในหน้ารายการต้องดูปกติทั้งสองแบบ รูปในเนื้อต้องถูก optimize → e2e ใน Task 3 ตรวจว่า `<img>` ในหน้าบันทึกชี้ไปที่ `/Claudy/_astro/` 
5. **ลิงก์ภายใต้ base path `/Claudy`** — ลิงก์ทุกตัวในเว็บต้องเปิดได้ ไม่หลุดไปที่ root ของโดเมน → e2e ใน Task 3 ไล่ลิงก์ภายในทุกตัวจากหน้าแรกแล้วต้องได้ 200

---

### Task 1: โครงโปรเจกต์ Astro + การ deploy

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/site.config.ts`, `src/pages/index.astro` (ชั่วคราว), `vitest.config.ts`, `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `npm run build`, `npm test` (Vitest), `npm run test:e2e` (Playwright), `export const SITE = { title: 'บันทึกของฉัน', description: string }` จาก `src/site.config.ts`

- [ ] **Step 1:** สร้างโปรเจกต์ Astro แบบ minimal ด้วย TypeScript strict ตั้ง `astro.config.mjs` ตาม Global Constraints; scripts: `dev`, `build`, `preview`, `test` (`vitest run`), `test:e2e` (`playwright test`)
- [ ] **Step 2:** เขียน `.github/workflows/deploy.yml`: trigger `push` เข้า `main` + `workflow_dispatch`; job build ใช้ `withastro/action@v3`; job deploy ใช้ `actions/deploy-pages@v4`; permissions `contents: read, pages: write, id-token: write`
- [ ] **Step 3:** รัน `npm run build` — Expected: build สำเร็จ, มี `dist/index.html`
- [ ] **Step 4:** Commit `chore: scaffold Astro site and Pages deploy workflow`

### Task 2: schema เนื้อหาและ logic ของบันทึก

**Files:**
- Create: `src/content.config.ts`, `src/lib/notes.ts`, `tests/unit/notes.test.ts`, `src/content/pages/about.md`

**Interfaces:**
- Consumes: Task 1
- Produces:
  - collection `notes` (glob `src/content/notes/**/*.md`) schema: `title: string` (min 1), `date: Date` (`z.coerce.date()`), `categories: string[]` (min 1), `cover?: image()`, `draft: boolean` (default `false`)
  - collection `pages` (glob `src/content/pages/*.md`) schema: `title: string`
  - ใน `src/lib/notes.ts` (generic `T extends { data: { date: Date; draft?: boolean; categories: string[] } }`):
    - `isPublished(note: T): boolean`
    - `sortByDateDesc(notes: T[]): T[]` — คืน array ใหม่ ไม่แก้ของเดิม
    - `categorySlug(name: string): string` — `trim`, `toLowerCase`, ช่องว่างต่อเนื่อง → `-`; ตัวอักษรไทยคงไว้
    - `groupByCategory(notes: T[]): { name: string; slug: string; notes: T[] }[]` — รวมตาม `categorySlug`, ใช้ชื่อที่พบครั้งแรกเป็น `name`, เรียงตามจำนวนมาก→น้อย แล้วตาม `name.localeCompare(b, 'th')`; บันทึกในแต่ละกลุ่มเรียงวันที่ใหม่→เก่า
    - `formatThaiDate(d: Date): string` — `Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeZone: 'Asia/Bangkok' })`
    - `excerpt(markdown: string, max = 120): string` — ตัดรูป `![..](..)`, เปลี่ยนลิงก์ `[a](b)` เป็น `a`, ตัดเครื่องหมาย `#*_>\``, ยุบช่องว่าง, ตัดที่ `max` ตัวอักษรแล้วต่อ `…` ถ้ายาวเกิน

- [ ] **Step 1: เขียน test ที่ fail** ใน `tests/unit/notes.test.ts`:

```ts
const n = (date: string, categories: string[], draft = false) =>
  ({ data: { date: new Date(date), categories, draft } });

test('isPublished excludes drafts', () => {
  expect(isPublished(n('2026-01-01', ['a'], true))).toBe(false);
  expect(isPublished(n('2026-01-01', ['a']))).toBe(true);
});
test('sortByDateDesc newest first and does not mutate', () => {
  const input = [n('2026-01-01', ['a']), n('2026-03-01', ['a'])];
  const out = sortByDateDesc(input);
  expect(out[0].data.date.getUTCMonth()).toBe(2);
  expect(input[0].data.date.getUTCMonth()).toBe(0);
});
test('categorySlug keeps Thai and normalises spaces/case', () => {
  expect(categorySlug('  ท่องเที่ยว  ญี่ปุ่น ')).toBe('ท่องเที่ยว-ญี่ปุ่น');
  expect(categorySlug('Food')).toBe('food');
});
test('groupByCategory merges equivalent names and orders by count', () => {
  const g = groupByCategory([n('2026-01-01', ['อาหาร']), n('2026-01-02', ['อาหาร ', 'งาน']), n('2026-01-03', ['Food']), n('2026-01-04', ['food'])]);
  expect(g.map(x => x.slug)).toEqual(['food', 'อาหาร', 'งาน']);
  expect(g[0].name).toBe('Food');
  expect(g[1].notes[0].data.date.getUTCDate()).toBe(2);
});
test('formatThaiDate uses Buddhist year in Bangkok time', () => {
  expect(formatThaiDate(new Date('2026-10-31T20:00:00Z'))).toBe('1 พฤศจิกายน 2569');
});
test('excerpt strips markdown and images and truncates', () => {
  expect(excerpt('# หัวข้อ\n\n![รูป](a.webp) ไป[ทะเล](http://x)มา **สนุก**')).toBe('หัวข้อ ไปทะเลมา สนุก');
  expect(excerpt('ก'.repeat(200), 10)).toBe('ก'.repeat(10) + '…');
});
```

- [ ] **Step 2:** รัน `npm test` — Expected: FAIL (ยังไม่มี module)
- [ ] **Step 3:** เขียน `src/lib/notes.ts` และ `src/content.config.ts` ตาม Interfaces; `src/content/pages/about.md` ใส่ `title: เกี่ยวกับฉัน` และข้อความตัวอย่าง
- [ ] **Step 4:** รัน `npm test` และ `npm run build` — Expected: PASS ทั้งคู่
- [ ] **Step 5:** Commit `feat: add notes content schema and helpers`

### Task 3: หน้าเว็บฝั่งคนอ่าน + RSS

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/NoteCard.astro`, `src/pages/[...page].astro` (แทน `index.astro`), `src/pages/notes/[id].astro`, `src/pages/categories/index.astro`, `src/pages/categories/[slug].astro`, `src/pages/about.astro`, `src/pages/404.astro`, `src/pages/rss.xml.ts`, `src/lib/published.ts`, `playwright.config.ts`, `tests/e2e/site.spec.ts`
- Delete: `src/pages/index.astro`

**Interfaces:**
- Consumes: ทุกฟังก์ชันจาก Task 2, `SITE` จาก Task 1
- Produces: `getPublishedNotes(): Promise<CollectionEntry<'notes'>[]>` ใน `src/lib/published.ts` (= `getCollection('notes')` → `filter(isPublished)` → `sortByDateDesc`) — **ทุกหน้าและ RSS ต้องดึงบันทึกผ่านฟังก์ชันนี้เท่านั้น**; URL: `/Claudy/`, `/Claudy/2/`…, `/Claudy/notes/<id>/`, `/Claudy/categories/`, `/Claudy/categories/<slug>/`, `/Claudy/about/`, `/Claudy/rss.xml`

- [ ] **Step 1:** เพิ่มบันทึกทดสอบใน `src/content/notes/`: `2026-10-01-test-draft.md` (`draft: true`, หมวด `ลับ`, ชื่อ `ร่างลับห้ามเห็น`), `2026-10-02-test-cover.md` (มี `cover` + 2 รูปในเนื้อ, หมวด `ท่องเที่ยว ญี่ปุ่น`), `2026-10-03-test-long.md` (ไม่มีรูป, มีข้อความไทยติดกัน 300 ตัวอักษร และ URL ยาว 200 ตัวอักษร, หมวด `อาหาร`, `งาน`); รูปทดสอบขนาด ≥ 3000px ใส่ `src/assets/notes/` (บันทึกเหล่านี้ Task 5 จะแทนด้วยตัวอย่างจริง)
- [ ] **Step 2: เขียน e2e ที่ fail** ใน `tests/e2e/site.spec.ts` (Playwright, viewport 375×800, `webServer: npm run build && npm run preview`, `baseURL: http://localhost:4321`, `launchOptions.executablePath: '/opt/pw-browsers/chromium'`):
  - `home lists published notes newest first`: หน้า `/Claudy/` มีชื่อ `test-long` ก่อน `test-cover`, ไม่มีข้อความ `ร่างลับห้ามเห็น`
  - `draft has no page and is not in categories or RSS`: `/Claudy/notes/2026-10-01-test-draft/` ตอบ 404; `/Claudy/categories/` ไม่มี `ลับ`; `/Claudy/rss.xml` ไม่มี `ร่างลับห้ามเห็น`
  - `Thai category page opens`: คลิกหมวด `ท่องเที่ยว ญี่ปุ่น` จากหน้าบันทึก → ได้ 200 และแสดง `test-cover`
  - `note images are optimised`: `<img>` ทุกตัวใน `/Claudy/notes/2026-10-02-test-cover/` มี `src` ขึ้นต้น `/Claudy/_astro/`
  - `no horizontal scroll at 375px`: ทุกหน้าที่กล่าวถึงข้างบน `document.documentElement.scrollWidth <= 375`
  - `all internal links resolve`: เก็บ `a[href]` ภายในทุกตัวจาก `/Claudy/`, `/Claudy/categories/` และหน้าบันทึก → request แต่ละอันได้ 200 และขึ้นต้น `/Claudy/`
  - `dates are Thai`: หน้าแรกมีข้อความ `ตุลาคม 2569`
- [ ] **Step 3:** รัน `npm run test:e2e` — Expected: FAIL
- [ ] **Step 4:** สร้างหน้าทั้งหมดตาม Files/Interfaces: layout มี header (ชื่อเว็บ + ลิงก์ หน้าแรก/หมวดหมู่/เกี่ยวกับ), ฟอนต์ไทย, CSS custom properties สีสว่าง/มืด, `overflow-wrap: anywhere` ที่เนื้อหา, `img { max-width: 100%; height: auto }`; การ์ดใช้ `<Image>` ของ Astro สำหรับ cover และ `excerpt(note.body)`; หน้าแรกใช้ `paginate(notes, { pageSize: 20 })`; หน้าหมวดใช้ `groupByCategory`; RSS ใช้ `@astrojs/rss` จาก `getPublishedNotes()`; เพิ่ม `<link rel="alternate" type="application/rss+xml">` ใน layout
- [ ] **Step 5:** รัน `npm test && npm run test:e2e` — Expected: PASS ทั้งหมด
- [ ] **Step 6:** Commit `feat: add reader pages, categories and RSS`

### Task 4: หน้าเขียน Sveltia CMS

**Files:**
- Create: `public/admin/index.html`, `public/admin/config.yml`, `tests/unit/cms-config.test.ts`
- Modify: `package.json` (devDependency `yaml`)

**Interfaces:**
- Consumes: schema จาก Task 2 (ชื่อฟิลด์ต้องตรงกันทุกตัว)

- [ ] **Step 1: เขียน test ที่ fail** `tests/unit/cms-config.test.ts` อ่าน `public/admin/config.yml` ด้วย `yaml` แล้ว assert:
  - `backend` = `{ name: 'github', repo: 'saharatyokthuan/Claudy', branch: 'main' }`
  - `media_folder === 'src/assets/notes'` และ `public_folder === '../../assets/notes'`
  - collection `notes`: `folder === 'src/content/notes'`, `create === true`, `slug === '{{year}}-{{month}}-{{day}}-{{uuid_short}}'`, ชื่อฟิลด์ = `['title','date','categories','cover','draft','body']`; `categories` เป็น widget `list`; `cover` เป็น `image` และ `required: false`; `draft` เป็น `boolean` default `false`
  - collection `pages` มี file `about` ที่ `src/content/pages/about.md`
  - `media_libraries.default.config.transformations.raster_image` = `{ format: 'webp', quality: 85, width: 2000, height: 2000 }`
- [ ] **Step 2:** รัน `npm test` — Expected: FAIL
- [ ] **Step 3:** เขียน `config.yml` ตาม test โดย label ทุกตัวเป็นภาษาไทย (`ชื่อเรื่อง`, `วันที่`, `หมวดหมู่`, `รูปปก`, `ฉบับร่าง`, `เนื้อหา`) และ `index.html` ที่โหลด `https://unpkg.com/@sveltia/cms@<เวอร์ชันล่าสุดที่ออกมาแล้ว ≥ 2 สัปดาห์, ระบุตายตัว>/dist/sveltia-cms.js` พร้อม `<meta name="robots" content="noindex">`
- [ ] **Step 4:** รัน `npm test && npm run build` — Expected: PASS; `dist/admin/index.html` และ `dist/admin/config.yml` มีอยู่
- [ ] **Step 5:** Commit `feat: add Sveltia CMS admin`

### Task 5: บันทึกตัวอย่าง + คู่มือภาษาไทย

**Files:**
- Delete: บันทึกทดสอบและรูปจาก Task 3 Step 1
- Create: บันทึกตัวอย่าง 3 ชิ้นใน `src/content/notes/` (ครอบคลุมกรณีเดียวกัน: มี cover + รูปในเนื้อ, ไม่มีรูป + ข้อความยาว, และ 1 ชิ้นเป็น `draft: true`) พร้อมรูปใน `src/assets/notes/`; `README.md`
- Modify: `tests/e2e/site.spec.ts` ให้อ้างชื่อ/id ของบันทึกตัวอย่างใหม่

- [ ] **Step 1:** แทนบันทึกทดสอบด้วยตัวอย่าง แก้ e2e ให้ชี้ตัวอย่างใหม่ (assertion เดิมทุกข้อคงไว้)
- [ ] **Step 2:** เขียน `README.md` ภาษาไทยตามหัวข้อ 5.6 ของ spec: เปิด Pages (Settings → Pages → Source: GitHub Actions); สร้าง fine-grained token เฉพาะ repo นี้ สิทธิ์ Contents: Read and write; เข้า `https://saharatyokthuan.github.io/Claudy/admin/` บนมือถือ เพิ่มลงหน้าจอหลัก; ขั้นตอนคัดลอกจาก Samsung Notes → วาง → แนบรูป → เผยแพร่ → รอ 1–2 นาที; วิธีลบบันทึกตัวอย่าง; วิธีเปลี่ยนชื่อเว็บใน `src/site.config.ts`
- [ ] **Step 3:** รัน `npm test && npm run test:e2e` — Expected: PASS
- [ ] **Step 4:** Commit `docs: add sample notes and Thai owner guide` แล้ว `git push -u origin claude/epic-hopper-o3zda7`

### Task 6: ส่งมอบ (ต้องได้รับอนุญาตจากเจ้าของ)

repo ยังไม่มี branch `main` ซึ่ง workflow และ CMS ใช้

- [ ] **Step 1:** ถามเจ้าของก่อนสร้าง `main` จาก commit แรกของ branch (`d3d21cb`) แล้วเปิด draft PR `claude/epic-hopper-o3zda7` → `main`
- [ ] **Step 2:** หลังเจ้าของ merge และเปิด Pages ตาม README ตรวจว่า `https://saharatyokthuan.github.io/Claudy/` และ `/Claudy/admin/` เปิดได้
