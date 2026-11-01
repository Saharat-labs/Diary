import { categorySlug, excerpt, formatThaiDate, groupByCategory, isPublished, parseNoteDate, sortByDateDesc } from '../../src/lib/notes';

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
test('categorySlug turns URL-unsafe punctuation into hyphens and keeps Thai marks', () => {
  expect(categorySlug('หนัง/ซีรีส์')).toBe('หนัง-ซีรีส์');
  expect(categorySlug('C# & .NET?')).toBe('c-net');
  expect(categorySlug('100% fun')).toBe('100-fun');
  expect(categorySlug('---a///b---')).toBe('a-b');
  expect(categorySlug('?!/')).toBe('');
});
test('groupByCategory skips names that slug to empty', () => {
  const g = groupByCategory([n('2026-01-01', ['?!', 'อาหาร'])]);
  expect(g.map((x) => x.slug)).toEqual(['อาหาร']);
});
test('groupByCategory merges equivalent names and orders by count', () => {
  const g = groupByCategory([n('2026-01-01', ['อาหาร']), n('2026-01-02', ['อาหาร ', 'งาน']), n('2026-01-03', ['Food']), n('2026-01-04', ['food'])]);
  expect(g.map(x => x.slug)).toEqual(['อาหาร', 'food', 'งาน']);
  expect(g[1].name).toBe('Food');
  expect(g[0].notes[0].data.date.getUTCDate()).toBe(2);
});
test('formatThaiDate uses Buddhist year in Bangkok time', () => {
  expect(formatThaiDate(new Date('2026-10-31T20:00:00Z'))).toBe('1 พฤศจิกายน 2569');
});
test('excerpt strips markdown and images and truncates', () => {
  expect(excerpt('# หัวข้อ\n\n![รูป](a.webp) ไป[ทะเล](http://x)มา **สนุก**')).toBe('หัวข้อ ไปทะเลมา สนุก');
  expect(excerpt('ก'.repeat(200), 10)).toBe('ก'.repeat(10) + '…');
});

test('parseNoteDate reads offset-less values as Bangkok time and leaves explicit offsets alone', () => {
  const iso = (v: unknown) => parseNoteDate(v).toISOString();
  expect(iso('2026-11-01T23:15:00')).toBe('2026-11-01T16:15:00.000Z');
  expect(iso('2026-11-01T23:15')).toBe('2026-11-01T16:15:00.000Z');
  expect(iso('2026-11-01 23:15:00')).toBe('2026-11-01T16:15:00.000Z');
  expect(iso('2026-11-01T23:15:00+07:00')).toBe('2026-11-01T16:15:00.000Z');
  expect(iso('2026-11-01T16:15:00Z')).toBe('2026-11-01T16:15:00.000Z');
  expect(iso('2026-11-01T16:15:00.000Z')).toBe('2026-11-01T16:15:00.000Z');
  expect(iso('2026-11-01')).toBe('2026-10-31T17:00:00.000Z');
});
test('parseNoteDate passes Date objects through and rejects garbage', () => {
  const d = new Date('2026-11-01T16:15:00Z');
  expect(parseNoteDate(d)).toBe(d);
  expect(Number.isNaN(parseNoteDate('not a date').getTime())).toBe(true);
  expect(Number.isNaN(parseNoteDate(undefined).getTime())).toBe(true);
});
