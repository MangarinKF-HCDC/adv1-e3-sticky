import { colors } from "./colors";
import { templates, type Template } from "./templates";

export type Note = {
  id: string;
  title: string;
  content: string;
  background: string;
  template: Template;
  updatedAt: number;
};

export function newNote(): Note {
  return { id: "", title: "", content: "<p></p>", background: colors[0].value, template: "blank", updatedAt: 0 };
}

export function textContent(html: string): string {
  const entities: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi, (match, entity: string) => {
      if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
      const code = entity.toLowerCase().startsWith("#x") ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function checklistPreview(html: string): { text: string; checked: boolean }[] {
  return Array.from(html.matchAll(/<li\b([^>]*)>([\s\S]*?)(?=<li\b|<\/li>)/gi))
    .filter(([, attributes]) => /\bdata-type=["']taskItem["']/i.test(attributes))
    .slice(0, 3)
    .map(([, attributes, body]) => ({
      text: textContent(body),
      checked: /\bdata-checked=["']true["']/i.test(attributes),
    }));
}

function normalizedTitle(title: string) {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

export function duplicateTitleError(notes: Note[], title: string, id = "") {
  const normalized = normalizedTitle(title);
  return normalized && notes.some((note) => note.id !== id && normalizedTitle(note.title) === normalized)
    ? "A sticky with this title already exists. Try another title."
    : "";
}

export function visibleNotes(notes: Note[], query: string): Note[] {
  const search = query.trim().toLowerCase();
  return notes
    .filter((note) => !search || (note.title + " " + textContent(note.content)).toLowerCase().includes(search))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function nextId(notes: Note[], timestamp: number) {
  let candidate = timestamp;
  while (notes.some((note) => note.id === String(candidate))) candidate += 1;
  return String(candidate);
}

export function saveNote(notes: Note[], draft: Note, timestamp = Date.now()): Note[] {
  const title = draft.title.trim();
  if (!title) throw new Error("Add a title before saving.");
  const duplicate = duplicateTitleError(notes, title, draft.id);
  if (duplicate) throw new Error(duplicate);
  if (draft.id && !notes.some((note) => note.id === draft.id)) throw new Error("This sticky no longer exists.");
  const saved: Note = {
    id: draft.id || nextId(notes, timestamp), title, content: draft.content,
    background: draft.background, template: draft.template, updatedAt: timestamp,
  };
  return draft.id ? notes.map((note) => note.id === draft.id ? saved : note) : [saved, ...notes];
}

export function deleteNote(notes: Note[], id: string): Note[] {
  return notes.filter((note) => note.id !== id);
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Keep older note bodies, checklists, and descriptions while discarding removed fields.
export function loadNotes(stored: string | null): Note[] {
  if (stored === null) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) throw new Error("Invalid saved notes");
  const restored: Note[] = [];
  for (const value of parsed) {
    if (!value || typeof value !== "object" || typeof value.title !== "string") throw new Error("Invalid saved note");
    const original = value as Record<string, unknown>;
    let content = typeof original.content === "string" ? original.content : "<p></p>";
    const description = typeof original.description === "string" ? original.description.trim() : "";
    if (description && !textContent(content).includes(description)) content = "<p>" + escapeHtml(description) + "</p>" + content;
    const timestamp = typeof original.updatedAt === "number" && Number.isFinite(original.updatedAt) && original.updatedAt > 0 ? original.updatedAt : Date.now();
    const originalId = typeof original.id === "string" || typeof original.id === "number" ? String(original.id) : "";
    const id = originalId && !restored.some((note) => note.id === originalId) ? originalId : nextId(restored, timestamp);
    restored.push({
      id, title: value.title, content,
      background: colors.some((color) => color.value === original.background) ? original.background as string : colors[0].value,
      template: templates.some((template) => template.id === original.template) ? original.template as Template : "blank",
      updatedAt: timestamp,
    });
  }
  return restored;
}
