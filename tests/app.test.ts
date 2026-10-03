import { test, beforeEach, afterEach } from "node:test";
import { expect } from "@playwright/test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";

let dom: JSDOM;
let root: Root | undefined;
let renderHome: () => Promise<void>;
const previousGlobals = new Map<string, PropertyDescriptor | undefined>();

async function settle() {
  for (let index = 0; index < 4; index++) await act(async () => { await new Promise((resolve) => dom.window.setTimeout(resolve, 0)); });
}

beforeEach(async () => {
  dom = new JSDOM('<!doctype html><html><body><div id="test-root"></div></body></html>', { url: "http://localhost:3000", pretendToBeVisual: true });
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  const globals = {
    window: dom.window, self: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage,
    HTMLElement: dom.window.HTMLElement, HTMLInputElement: dom.window.HTMLInputElement, Element: dom.window.Element, Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver, getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true, innerHeight: 900, innerWidth: 1280,
  };
  for (const [key, value] of Object.entries(globals)) {
    previousGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
  }
  const { createRoot } = await import("react-dom/client");
  const pageModule = await import("../app/page");
  const Home = typeof pageModule.default === "function" ? pageModule.default : (pageModule.default as unknown as { default: typeof pageModule.default }).default;
  renderHome = async () => {
    root = createRoot(dom.window.document.getElementById("test-root")!);
    await act(async () => root!.render(createElement(Home)));
    await settle();
  };
});

afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = undefined;
  dom.window.close();
  for (const [key, descriptor] of previousGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  previousGlobals.clear();
});

async function click(selector: string) {
  const button = dom.window.document.querySelector<HTMLButtonElement>(selector);
  expect(button, selector).not.toBeNull();
  await act(async () => button!.click());
  await settle();
}

async function title(value: string) {
  const input = dom.window.document.querySelector<HTMLInputElement>("#note-title")!;
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
  await settle();
}

async function buttonText(text: string, scope = "body") {
  const buttons = [...dom.window.document.querySelectorAll<HTMLButtonElement>(scope + " button")];
  const button = buttons.find((button) => button.textContent?.trim() === text);
  expect(button, text).toBeDefined();
  await act(async () => button!.click());
  await settle();
}

test("the actual page creates, updates, reloads and deletes locally stored notes", async () => {
  await renderHome();
  expect(dom.window.document.body.textContent).toContain("No stickies yet.");
  const headerCreate = dom.window.document.querySelector(".app-header .header-create-button")!;
  expect(dom.window.document.querySelector(".search-toggle")?.nextElementSibling).toBe(headerCreate);
  expect(headerCreate.nextElementSibling?.classList.contains("header-divider")).toBe(true);
  expect(dom.window.document.querySelector("aside")).toBeNull();
  expect(dom.window.document.querySelector('[aria-label="Open menu"]')).toBeNull();
  await click(".app-header .header-create-button");
  expect(dom.window.document.querySelector<HTMLInputElement>("#note-title")?.placeholder).toBe("Title");
  expect(dom.window.document.querySelector('[aria-label="Description"]')).not.toBeNull();
  const toolbar = [...dom.window.document.querySelectorAll(".editor-toolbar button")].map((button) => button.getAttribute("aria-label"));
  expect(toolbar).toEqual(["Bold", "Italic", "Underline", "Strike", "Align left", "Align center", "Align right", "Bullets", "Numbers", "Checklist"]);
  await title("Alpha");
  await buttonText("Save", ".note-drawer");
  expect(dom.window.document.querySelectorAll(".note-card")).toHaveLength(1);
  expect(JSON.parse(dom.window.localStorage.getItem("sticky-notes")!)[0].title).toBe("Alpha");
  await click('[aria-label="Open Alpha"]');
  await title("Beta");
  await buttonText("Save", ".note-drawer");
  await act(async () => root!.unmount());
  root = undefined;
  await renderHome();
  expect(dom.window.document.querySelector('[aria-label="Open Beta"]')).not.toBeNull();
  await click('[aria-label="Open Beta"]');
  await buttonText("Delete", ".note-drawer");
  expect(dom.window.document.querySelector(".modal")).not.toBeNull();
  expect(dom.window.document.querySelector(".note-drawer")?.hasAttribute("inert")).toBe(true);
  await buttonText("Delete sticky", ".modal");
  expect(dom.window.document.querySelectorAll(".note-card")).toHaveLength(0);
  expect(JSON.parse(dom.window.localStorage.getItem("sticky-notes")!)).toEqual([]);
});

test("duplicate titles, nested Escape handling and saved theme preferences work", async () => {
  dom.window.localStorage.setItem("sticky-notes", JSON.stringify([{ id: "existing", title: "Existing", content: "<p>Body</p>", background: "#FEF08A", template: "blank", updatedAt: 1000 }]));
  dom.window.localStorage.setItem("sticky-theme", "dark");
  dom.window.localStorage.setItem("sticky-sidebar", "collapsed");
  await renderHome();
  expect(dom.window.document.documentElement.classList.contains("dark")).toBe(true);
  expect(dom.window.localStorage.getItem("sticky-sidebar")).toBeNull();
  await click('[aria-label="Switch to light mode"]');
  expect(dom.window.localStorage.getItem("sticky-theme")).toBe("light");
  await click(".app-header .header-create-button");
  await title("EXISTING");
  expect(dom.window.document.querySelector("#title-error")?.textContent).toContain("already exists");
  const save = [...dom.window.document.querySelectorAll<HTMLButtonElement>(".note-drawer button")].find((button) => button.textContent === "Save");
  expect(save?.disabled).toBe(true);
  await title("New title");
  expect(dom.window.document.querySelector("#title-error")).toBeNull();
  await click('[aria-label="Close editor"]');
  expect(dom.window.document.querySelector(".modal")).not.toBeNull();
  await act(async () => dom.window.document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  await settle();
  expect(dom.window.document.querySelector(".modal")).toBeNull();
  expect(dom.window.document.querySelector<HTMLInputElement>("#note-title")?.value).toBe("New title");
  await click('[aria-label="Close editor"]');
  await buttonText("Discard changes", ".modal");
  expect(dom.window.document.querySelector(".note-drawer")).toBeNull();
  expect(dom.window.document.body.style.overflow).toBe("");
  expect(JSON.parse(dom.window.localStorage.getItem("sticky-notes")!)).toHaveLength(1);
  await click('[aria-label="Open Existing"]');
  await click('[aria-label="Expand editor"]');
  expect(dom.window.document.querySelector(".note-drawer")?.classList.contains("expanded")).toBe(true);
  const template = dom.window.document.querySelector<HTMLSelectElement>("#note-template")!;
  await act(async () => {
    template.value = "grid";
    template.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  await settle();
  expect(dom.window.document.querySelector(".modal")?.textContent).toContain("Switch template?");
  expect(template.value).toBe("blank");
  await buttonText("Apply template", ".modal");
  expect(template.value).toBe("grid");
  await click('[aria-label="Close editor"]');
  await buttonText("Discard changes", ".modal");
  expect(JSON.parse(dom.window.localStorage.getItem("sticky-notes")!)[0].content).toBe("<p>Body</p>");

});
