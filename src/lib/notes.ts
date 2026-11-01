export interface NoteLike {
  data: { date: Date; draft?: boolean; categories: string[] };
}

export interface CategoryGroup<T extends NoteLike> {
  name: string;
  slug: string;
  notes: T[];
}

export function isPublished<T extends NoteLike>(note: T): boolean {
  return note.data.draft !== true;
}

export function sortByDateDesc<T extends NoteLike>(notes: T[]): T[] {
  return [...notes].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function categorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function groupByCategory<T extends NoteLike>(notes: T[]): CategoryGroup<T>[] {
  const groups = new Map<string, CategoryGroup<T>>();
  for (const note of notes) {
    const seen = new Set<string>();
    for (const raw of note.data.categories) {
      const slug = categorySlug(raw);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      let group = groups.get(slug);
      if (!group) {
        group = { name: raw.trim(), slug, notes: [] };
        groups.set(slug, group);
      }
      group.notes.push(note);
    }
  }
  return [...groups.values()]
    .map((g) => ({ ...g, notes: sortByDateDesc(g.notes) }))
    .sort((a, b) => b.notes.length - a.notes.length || a.name.localeCompare(b.name, 'th'));
}

const thaiDate = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeZone: 'Asia/Bangkok' });

export function formatThaiDate(d: Date): string {
  return thaiDate.format(d);
}

export function excerpt(markdown: string, max = 120): string {
  const text = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const chars = [...text];
  return chars.length > max ? chars.slice(0, max).join('') + '…' : text;
}
