import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const cfg = parse(readFileSync('public/admin/config.yml', 'utf8'));
const field = (fields: any[], name: string) => fields.find((f) => f.name === name);

test('backend points at this repo main branch', () => {
  expect(cfg.backend).toEqual({ name: 'github', repo: 'saharatyokthuan/Diary', branch: 'main' });
});
test('media goes to src/assets/notes, referenced relatively from each collection', () => {
  expect(cfg.media_folder).toBe('src/assets/notes');
  expect(cfg.public_folder.startsWith('/')).toBe(true);
  for (const c of cfg.collections) {
    expect(c.media_folder, c.name).toBe('/src/assets/notes');
    expect(c.public_folder, c.name).toBe('../../assets/notes');
  }
});
test('notes collection matches the content schema', () => {
  const notes = cfg.collections.find((c: any) => c.name === 'notes');
  expect(notes.folder).toBe('src/content/notes');
  expect(notes.create).toBe(true);
  expect(notes.slug).toBe('{{year}}-{{month}}-{{day}}-{{uuid_short}}');
  expect(notes.fields.map((f: any) => f.name)).toEqual(['title', 'date', 'categories', 'cover', 'draft', 'body']);
  expect(field(notes.fields, 'categories').widget).toBe('list');
  expect(field(notes.fields, 'cover').widget).toBe('image');
  expect(field(notes.fields, 'cover').required).toBe(false);
  expect(field(notes.fields, 'draft').widget).toBe('boolean');
  expect(field(notes.fields, 'draft').default).toBe(false);
});
test('pages collection has the about file', () => {
  const pages = cfg.collections.find((c: any) => c.name === 'pages');
  const about = pages.files.find((f: any) => f.name === 'about');
  expect(about.file).toBe('src/content/pages/about.md');
});
test('uploaded photos are resized to webp', () => {
  expect(cfg.media_libraries.default.config.transformations.raster_image).toEqual({ format: 'webp', quality: 85, width: 2000, height: 2000 });
});

const notesFields = () => cfg.collections.find((c: any) => c.name === 'notes').fields;

test('date is saved with a +07:00 offset (Sveltia input_timezone) and pre-filled with the current time', () => {
  const date = field(notesFields(), 'date');
  expect(date.widget).toBe('datetime');
  expect(date.input_timezone).toBe('Asia/Bangkok');
  expect(date.default).toBe('{{now}}');
  // output_utc would turn 23:15 Bangkok into the previous-day UTC value; we want the local offset kept
  expect(date.output_utc).toBeUndefined();
});
test('category hint explains the one-box-per-category editor and warns about spelling', () => {
  const hint: string = field(notesFields(), 'categories').hint;
  expect(hint).toContain('ช่องละ 1 หมวด');
  expect(hint).toContain('Add');
  expect(hint).toContain('ใช้ชื่อหมวดเดิมให้สะกดเหมือนเดิม');
  expect(hint).not.toContain('คั่นด้วย');
});
test('uploaded file names are slugified so spaces never reach markdown image paths', () => {
  expect(cfg.media_libraries.default.config.slugify_filename).toBe(true);
});
