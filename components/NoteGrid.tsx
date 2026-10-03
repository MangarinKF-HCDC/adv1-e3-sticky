"use client";

import type { Note } from "@/lib/notes";
import NoteCard from "./NoteCard";

export default function NoteGrid({
  notes,
  onOpen,
}: {
  notes: Note[];
  onOpen: (note: Note) => void;
}) {
  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onOpen={() => onOpen(note)} />
      ))}
    </div>
  );
}
