import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../site.config';
import { excerpt } from '../lib/notes';
import { getPublishedNotes, url } from '../lib/published';

export async function GET(context: APIContext) {
  const notes = await getPublishedNotes();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items: notes.map((note) => ({
      title: note.data.title,
      pubDate: note.data.date,
      description: excerpt(note.body ?? '', 300),
      categories: note.data.categories,
      link: url(`notes/${note.id}/`),
    })),
    customData: '<language>th</language>',
  });
}
