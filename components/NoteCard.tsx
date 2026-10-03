"use client";

import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { checklistPreview, textContent, type Note } from "@/lib/notes";

export default function NoteCard({
  note,
  onOpen,
}: {
  note: Note;
  onOpen: () => void;
}) {
  const tasks = checklistPreview(note.content);
  return (
    <article
      className={"note-card paper-" + note.template}
      style={{ "--note-background": note.background } as CSSProperties}
    >
      <button
        type="button"
        className="note-open"
        onClick={onOpen}
        aria-label={"Open " + note.title}
      >
        <h2>{note.title}</h2>
        {tasks.length ? (
          <div className="card-tasks">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={"card-task-item " + (task.checked ? "done" : "")}
              >
                <span className="task-box" aria-hidden="true">
                  {task.checked && <Check size={12} />}
                </span>
                <span className="card-task-text">
                  {task.checked && (
                    <span className="visually-hidden">Completed: </span>
                  )}
                  {task.text || "Untitled checklist item"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="note-preview">{textContent(note.content)}</p>
        )}
        <time
          className="note-date"
          dateTime={new Date(note.updatedAt).toISOString()}
        >
          {new Date(note.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "Asia/Manila",
          })}
        </time>
      </button>
    </article>
  );
}
