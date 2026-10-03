import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { JSDOM } from "jsdom";
import { Editor } from "@tiptap/core";
import { noteEditorExtensions } from "../lib/editor";
import { checklistPreview, loadNotes, newNote, saveNote } from "../lib/notes";
import { templates } from "../lib/templates";

let dom: JSDOM;
const editors: Editor[] = [];
const previousGlobals = new Map<string, PropertyDescriptor | undefined>();

test.beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
  const style = dom.window.document.createElement("style");
  style.textContent = readFileSync("app/globals.css", "utf8").replace(/^@(?:import|custom-variant)[^\n]+\n/gm, "").replace(/@theme inline \{[^}]+\}/, "");
  dom.window.document.head.append(style);
  const globals = {
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement, Element: dom.window.Element, Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    innerHeight: 900, innerWidth: 1280,
  };
  for (const [key, value] of Object.entries(globals)) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
});

test.afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
  dom.window.close();
  for (const [key, descriptor] of previousGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  previousGlobals.clear();
});

function makeEditor(content: string) {
  const element = dom.window.document.createElement("div");
  dom.window.document.body.append(element);
  const editor = new Editor({ element, extensions: noteEditorExtensions(), content });
  editors.push(editor);
  return editor;
}

test("applies all three alignments and retains alignment after saving and reloading", () => {
  const editor = makeEditor("<p>Aligned note</p>");
  for (const alignment of ["left", "center", "right"]) {
    expect(editor.commands.setTextAlign(alignment)).toBe(true);
    expect(editor.isActive({ textAlign: alignment })).toBe(true);
    expect(editor.getHTML()).toContain("text-align: " + alignment);
  }
  const stored = saveNote([], { ...newNote(), title: "Alignment", content: editor.getHTML() });
  const reloaded = makeEditor(loadNotes(JSON.stringify(stored))[0].content);
  expect(reloaded.isActive({ textAlign: "right" })).toBe(true);
});

test("checks and unchecks checklist items and keeps paragraph alignment inside the item", () => {
  const editor = makeEditor('<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Long checklist item</p></li><li data-type="taskItem" data-checked="false"><p>Second item</p></li></ul>');
  editor.commands.setTextSelection(3);
  expect(editor.commands.setTextAlign("center")).toBe(true);
  expect(editor.commands.updateAttributes("taskItem", { checked: true })).toBe(true);
  expect(checklistPreview(editor.getHTML())[0]).toEqual({ text: "Long checklist item", checked: true });
  expect(editor.view.dom.querySelector('li[data-checked] > div > p')?.getAttribute("style")).toContain("text-align: center");
  const item = editor.view.dom.querySelector<HTMLElement>('ul[data-type="taskList"] > li')!;
  const label = item.querySelector<HTMLElement>(":scope > label")!;
  const checkbox = label.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
  const body = item.querySelector<HTMLElement>(":scope > div")!;
  expect(dom.window.getComputedStyle(item).gap).toBe("8px");
  expect(dom.window.getComputedStyle(label).marginTop).toBe("3px");
  expect(dom.window.getComputedStyle(checkbox).width).toBe("16px");
  expect(dom.window.getComputedStyle(checkbox).height).toBe("16px");
  expect(dom.window.getComputedStyle(body).textAlign).toBe("left");
  expect(dom.window.getComputedStyle(body.querySelector("p")!).textAlign).toBe("center");

  const reloaded = makeEditor(loadNotes(JSON.stringify(saveNote([], { ...newNote(), title: "Checklist", template: "checklist", content: editor.getHTML() })))[0].content);
  expect(checklistPreview(reloaded.getHTML())[0].checked).toBe(true);
  reloaded.commands.setTextSelection(3);
  expect(reloaded.commands.updateAttributes("taskItem", { checked: false })).toBe(true);
  expect(checklistPreview(reloaded.getHTML())[0].checked).toBe(false);
});

test("supports bold, italic, underline, strike, bullets, numbers and checklists", () => {
  const editor = makeEditor("<p>Format this note</p>");
  editor.commands.selectAll();
  editor.commands.toggleBold();
  editor.commands.toggleItalic();
  editor.commands.toggleUnderline();
  editor.commands.toggleStrike();
  expect(editor.getHTML()).toContain("<strong>");
  expect(editor.getHTML()).toContain("<em>");
  expect(editor.getHTML()).toContain("<u>");
  expect(editor.getHTML()).toContain("<s>");
  editor.commands.setTextSelection(2);
  editor.commands.toggleBulletList();
  expect(editor.isActive("bulletList")).toBe(true);
  editor.commands.toggleOrderedList();
  expect(editor.isActive("orderedList")).toBe(true);
  editor.commands.toggleTaskList();
  expect(editor.isActive("taskList")).toBe(true);
});

test("loads every template and shows the Description placeholder on an empty note", () => {
  for (const template of templates) {
    const editor = makeEditor(template.content);
    expect(editor.getHTML()).toBeTruthy();
    if (template.id === "checklist") expect(editor.view.dom.querySelectorAll('li[data-checked]')).toHaveLength(2);
  }
  const editor = makeEditor("<p></p>");
  expect(editor.view.dom.querySelector("p")?.getAttribute("data-placeholder")).toBe("Description");
});
