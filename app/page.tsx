"use client";

import { useEffect, useState } from "react";
import { Check, Plus, StickyNote, X } from "lucide-react";
import Header from "@/components/Header";
import NoteGrid from "@/components/NoteGrid";
import NoteDrawer from "@/components/NoteDrawer";
import {
  deleteNote,
  loadNotes,
  newNote,
  saveNote,
  visibleNotes,
  type Note,
} from "@/lib/notes";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [storageError, setStorageError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const restored = loadNotes(localStorage.getItem("sticky-notes"));
        const storedTheme = localStorage.getItem("sticky-theme");
        setNotes(restored);
        setTheme(
          storedTheme === "light" || storedTheme === "dark"
            ? storedTheme
            : window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light",
        );
        setLoaded(true);
      } catch {
        setStorageError(
          "Saved notes could not be loaded. Existing browser data has not been overwritten.",
        );
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem("sticky-notes", JSON.stringify(notes));
        localStorage.removeItem("sticky-categories");
        localStorage.removeItem("sticky-sidebar");
        setStorageError("");
      } catch {
        setStorageError(
          "Browser storage is full or unavailable. Your latest changes are saved only for this session.",
        );
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [notes, loaded]);

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("sticky-theme", theme);
    } catch {
      // The notes storage effect displays the storage error.
    }
  }, [theme, loaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function createNote() {
    setSelectedNote(newNote());
  }

  function handleSave(draft: Note) {
    setNotes(saveNote(notes, draft));
    setSelectedNote(null);
    setToast(draft.id ? "Sticky updated." : "New sticky saved.");
  }

  function handleDelete(id: string) {
    setNotes((previous) => deleteNote(previous, id));
    setSelectedNote(null);
    setToast("Sticky deleted.");
  }

  const matches = visibleNotes(notes, searchQuery);

  return (
    <div className="sticky-app">
      <div className="notes-wave-background" aria-hidden="true">
        <div className="notes-wave-ribbons" />
      </div>
      <Header
        searchQuery={searchQuery}
        isSearchOpen={isSearchOpen}
        onSearch={setSearchQuery}
        onToggleSearch={() => {
          if (isSearchOpen) setSearchQuery("");
          setSearchOpen(!isSearchOpen);
        }}
        onCreate={createNote}
        loaded={loaded}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
      />
      <main className="main-content">
        <div className="notes-page-heading">
          <div>
            <h1>
              {searchQuery.trim() ? "Search results" : "Your stickies"}
              <span className="heading-dot">.</span>
            </h1>
          </div>
          <span className="notes-total" aria-live="polite">
            {matches.length} {matches.length === 1 ? "sticky" : "stickies"}
          </span>
        </div>
        {storageError && (
          <p className="storage-error" role="alert">
            {storageError}
          </p>
        )}
        {!loaded && !storageError ? (
          <div className="empty-state" role="status">
            <StickyNote size={36} />
            <p>Loading your stickies…</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <StickyNote size={36} />
            </span>
            <h2>
              {searchQuery.trim() ? "No stickies found." : "No stickies yet."}
            </h2>
            <p>
              {searchQuery.trim()
                ? "Try another word."
                : "Create your first one."}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={createNote}
                disabled={!loaded}
              >
                <Plus size={18} />
                Create a sticky
              </button>
            )}
          </div>
        ) : (
          <NoteGrid notes={matches} onOpen={setSelectedNote} />
        )}
      </main>
      {selectedNote && (
        <NoteDrawer
          key={selectedNote.id || "new"}
          initial={selectedNote}
          notes={notes}
          onClose={() => setSelectedNote(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
