import { toISODate } from "./dates";
import type { Project, TodoPriority } from "../types";

export type QuickAddResult = {
  title: string;
  dueDate: string | null;
  priority: TodoPriority | null;
  projectId: string | null;
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, januari: 0,
  feb: 1, february: 1, februari: 1,
  mar: 2, march: 2, maret: 2,
  apr: 3, april: 3,
  may: 4, mei: 4,
  jun: 5, june: 5, juni: 5,
  jul: 6, july: 6, juli: 6,
  aug: 7, august: 7, agu: 7, agustus: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9, okt: 9, oktober: 9,
  nov: 10, november: 10,
  dec: 11, december: 11, des: 11, desember: 11,
};

const addDays = (base: Date, days: number) => {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + days);
  return d;
};

// note: hari yang sama dengan hari ini dianggap pekan depan, "friday" saat hari Jumat berarti Jumat depan
function nextWeekday(base: Date, weekday: number) {
  const diff = (weekday - base.getDay() + 7) % 7 || 7;
  return addDays(base, diff);
}

type DateMatch = { date: Date; start: number; end: number };

// note: urutan pola penting, frasa lebih panjang ("minggu depan") harus dicoba sebelum kata tunggal ("minggu")
function findDate(text: string, now: Date): DateMatch | null {
  const patterns: [RegExp, (m: RegExpMatchArray) => Date | null][] = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/i, (m) => {
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      return d.getMonth() === +m[2] - 1 ? d : null;
    }],
    [/\b(?:next week|minggu depan|pekan depan)\b/i, () => nextWeekday(now, 1)],
    [/\b(?:in (\d{1,3}) days?|(\d{1,3}) hari lagi)\b/i, (m) => addDays(now, +(m[1] ?? m[2]))],
    [/\b(?:today|hari ini)\b/i, () => addDays(now, 0)],
    [/\b(?:tomorrow|tmrw|besok)\b/i, () => addDays(now, 1)],
    [/\b(?:lusa)\b/i, () => addDays(now, 2)],
    [/\b(?:next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday|senin|selasa|rabu|kamis|jumat|sabtu)\b/i,
      (m) => nextWeekday(now, WEEKDAYS[m[1].toLowerCase()])],
    [/\b(\d{1,2}) ([a-z]{3,9})\b/i, (m) => {
      const month = MONTHS[m[2].toLowerCase()];
      if (month === undefined) return null;
      const d = new Date(now.getFullYear(), month, +m[1]);
      if (d.getMonth() !== month) return null;
      // note: tanggal yang sudah lewat tahun ini dianggap tahun depan
      if (d < addDays(now, 0)) d.setFullYear(d.getFullYear() + 1);
      return d;
    }],
  ];

  for (const [re, build] of patterns) {
    const m = text.match(re);
    if (!m || m.index === undefined) continue;
    const date = build(m);
    if (date) return { date, start: m.index, end: m.index + m[0].length };
  }
  return null;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

function findProject(text: string, projects: Project[]) {
  const re = /(^|\s)#([^\s#]+)/g;
  for (const m of text.matchAll(re)) {
    const wanted = slug(m[2]);
    if (!wanted) continue;
    const exact = projects.find((p) => slug(p.name) === wanted);
    const project = exact ?? projects.find((p) => slug(p.name).startsWith(wanted));
    if (project) {
      const start = (m.index ?? 0) + m[1].length;
      return { project, start, end: start + m[2].length + 1 };
    }
  }
  return null;
}

export function parseQuickAdd(
  input: string,
  projects: Project[],
  now: Date = new Date(),
): QuickAddResult {
  let text = input;
  const cut = (start: number, end: number) => {
    text = `${text.slice(0, start)} ${text.slice(end)}`;
  };

  let priority: TodoPriority | null = null;
  const pm = text.match(/(^|\s)p([123])(?=\s|$)/i);
  if (pm && pm.index !== undefined) {
    priority = Number(pm[2]) as TodoPriority;
    cut(pm.index + pm[1].length, pm.index + pm[0].length);
  }

  let projectId: string | null = null;
  const proj = findProject(text, projects);
  if (proj) {
    projectId = proj.project.id;
    cut(proj.start, proj.end);
  }

  let dueDate: string | null = null;
  const date = findDate(text, now);
  if (date) {
    dueDate = toISODate(date.date);
    cut(date.start, date.end);
  }

  const title = text.replace(/\s+/g, " ").trim();
  // note: kalau semua kata terbaca sebagai token, pakai teks asli sebagai judul
  if (!title) return { title: input.trim(), dueDate: null, priority: null, projectId: null };
  return { title, dueDate, priority, projectId };
}
