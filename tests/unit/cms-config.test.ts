import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const cfg = parse(readFileSync('public/admin/config.yml', 'utf8'));
const field = (fields: any[], name: string) => fields.find((f) => f.name === name);

test('backend points at this repo main branch', () => {
  expect(cfg.backend).toEqual({ name: 'github', repo: 'saharatyokthuan/Claudy', branch: 'main' });
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
