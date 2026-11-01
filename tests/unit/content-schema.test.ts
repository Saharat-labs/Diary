import { z } from 'astro/zod';

// content.config.ts imports Astro's virtual modules; stub them so the real schema can be exercised.
vi.mock('astro:content', async () => {
  const { z } = await import('astro/zod');
  return { z, defineCollection: (c: unknown) => c };
});
vi.mock('astro/loaders', () => ({ glob: () => ({}) }));

async function noteSchema() {
  const { collections } = await import('../../src/content.config');
  return (collections.notes as any).schema({ image: () => z.any() }) as z.ZodTypeAny;
}
const base = { title: 'x', categories: ['a'] };

test('quoted offset-less date is read as Bangkok time', async () => {
  const out = (await noteSchema()).parse({ ...base, date: '2026-11-01T23:15:00' });
  expect(out.date.toISOString()).toBe('2026-11-01T16:15:00.000Z');
});
test('dates with an offset, Date objects and date-only strings still work', async () => {
  const schema = await noteSchema();
  expect(schema.parse({ ...base, date: '2026-11-01T23:15:00+07:00' }).date.toISOString()).toBe('2026-11-01T16:15:00.000Z');
  expect(schema.parse({ ...base, date: new Date('2026-11-01T16:15:00Z') }).date.toISOString()).toBe('2026-11-01T16:15:00.000Z');
  expect(schema.parse({ ...base, date: '2026-11-01' }).date.toISOString()).toBe('2026-10-31T17:00:00.000Z');
});
test('missing or invalid date is rejected', async () => {
  const schema = await noteSchema();
  expect(schema.safeParse(base).success).toBe(false);
  expect(schema.safeParse({ ...base, date: 'nope' }).success).toBe(false);
});
