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

// ตัวอักษร/เครื่องหมายวรรณยุกต์/ตัวเลขของทุกภาษา (รวมไทย) คงไว้ ส่วนอื่น เช่น / ? # % & . เว้นวรรค กลายเป็น "-"
export function categorySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
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

const BANGKOK_OFFSET = '+07:00';
const LOCAL_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

// วันที่ที่ไม่มี Z/offset (เช่น 2026-11-01T23:15:00) ให้ถือเป็นเวลาไทย ไม่ใช่ UTC
// ค่าที่มี offset อยู่แล้ว และ Date ที่ YAML แปลงมาให้แล้ว ใช้ตามเดิม
export function parseNoteDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v !== 'string') return new Date(v as number);
  const s = v.trim();
  if (LOCAL_DATE_ONLY.test(s)) return new Date(`${s}T00:00:00${BANGKOK_OFFSET}`);
  if (LOCAL_DATE_TIME.test(s)) return new Date(`${s.replace(' ', 'T')}${BANGKOK_OFFSET}`);
  return new Date(s);
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
