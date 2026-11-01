import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { parseNoteDate } from './lib/notes';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      date: z.preprocess(parseNoteDate, z.date()),
      categories: z.array(z.string()).min(1),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { notes, pages };
