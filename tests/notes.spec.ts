import { test, expect } from "@playwright/test";
import { checklistPreview, deleteNote, duplicateTitleError, loadNotes, newNote, saveNote, textContent, visibleNotes } from "../lib/notes";

test("adds, updates, persists and deletes notes without mutating existing data", () => {
  const initial = saveNote([], { ...newNote(), title: "  First note  ", content: "<p>Hello</p>" }, 1000);
  const withSecond = saveNote(initial, { ...newNote(), title: "Second note" }, 2000);
  const updated = saveNote(withSecond, { ...initial[0], content: "<p>Updated</p>", template: "grid" }, 3000);
  expect(initial[0].content).toBe("<p>Hello</p>");
  expect(updated).toHaveLength(2);
  expect(visibleNotes(updated, "")[0].title).toBe("First note");
  const reloaded = loadNotes(JSON.stringify(updated));
  expect(reloaded).toEqual(updated);
  expect(deleteNote(reloaded, initial[0].id).map((note) => note.title)).toEqual(["Second note"]);
});

test("blocks empty and duplicate titles but allows editing the same note", () => {
  const notes = saveNote([], { ...newNote(), title: "My note" }, 1000);
  expect(() => saveNote(notes, { ...newNote(), title: "  " })).toThrow("Add a title");
  expect(() => saveNote(notes, { ...newNote(), title: "  MY   NOTE " })).toThrow("already exists");
  expect(duplicateTitleError(notes, "my note", notes[0].id)).toBe("");
  expect(saveNote(notes, { ...notes[0], title: "MY NOTE" })[0].title).toBe("MY NOTE");
});

test("generates distinct Date.now-based ids when saves happen in the same millisecond", () => {
  const first = saveNote([], { ...newNote(), title: "First" }, 1000);
  const second = saveNote(first, { ...newNote(), title: "Second" }, 1000);
  expect(second.map((note) => note.id)).toEqual(["1001", "1000"]);
});

test("migrates old notes and descriptions into the six-field model without losing the body", () => {
  const oldNotes = [{
    id: "old-note", title: "Existing", description: "Keep <this> & that",
    content: '<p style="text-align: center">Body</p><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Done</p></li></ul>',
    background: "#BFDBFE", template: "checklist", updatedAt: 1000,
    categoryId: "work", pinned: true, saved: true, protected: true, pin: "1234", isTask: true,
  }];
  const migrated = loadNotes(JSON.stringify(oldNotes));
  expect(Object.keys(migrated[0]).sort()).toEqual(["background", "content", "id", "template", "title", "updatedAt"]);
  expect(migrated[0].content).toContain('<p>Keep &lt;this&gt; &amp; that</p>');
  expect(migrated[0].content).toContain(oldNotes[0].content);
  expect(loadNotes(JSON.stringify(migrated))).toEqual(migrated);
});

test("leaves invalid storage untouched by refusing to load it", () => {
  expect(loadNotes(null)).toEqual([]);
  expect(() => loadNotes("{")).toThrow();
  expect(() => loadNotes('{"notes":[]}')).toThrow("Invalid saved notes");
  expect(() => loadNotes('[{"id":"invalid"}]')).toThrow("Invalid saved note");
});

test("searches note titles and formatted body text, newest first", () => {
  const older = saveNote([], { ...newNote(), title: "Older", content: "<p>A <strong>secret</strong> idea &amp; plan</p>" }, 1000);
  const notes = saveNote(older, { ...newNote(), title: "Secret title" }, 2000);
  expect(visibleNotes(notes, " SECRET ").map((note) => note.title)).toEqual(["Secret title", "Older"]);
  expect(visibleNotes(notes, "idea & plan").map((note) => note.title)).toEqual(["Older"]);
  expect(visibleNotes(notes, "missing")).toHaveLength(0);
});

test("decodes plain previews without exposing HTML or script text", () => {
  expect(textContent('<p>One&nbsp;&amp; two</p><script>hidden()</script><p>&lt;three&gt; &#x1F4DD;</p>')).toBe("One & two <three> 📝");
});

test("shows the first three checklist items and preserves nested checked states", () => {
  const html = '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked></label><div><p>Parent</p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Child</p></li></ul></div></li><li data-type="taskItem" data-checked="true"><p>Another</p></li><li data-type="taskItem" data-checked="false"><p>Fourth</p></li></ul>';
  expect(checklistPreview(html)).toEqual([
    { text: "Parent", checked: true }, { text: "Child", checked: false }, { text: "Another", checked: true },
  ]);
});
