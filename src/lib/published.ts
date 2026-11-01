import { getCollection, type CollectionEntry } from 'astro:content';
import { isPublished, sortByDateDesc } from './notes';

export async function getPublishedNotes(): Promise<CollectionEntry<'notes'>[]> {
  const all = await getCollection('notes');
  return sortByDateDesc(all.filter(isPublished));
}

export const url = (path = ''): string => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}`;
