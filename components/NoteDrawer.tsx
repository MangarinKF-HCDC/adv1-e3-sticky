"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Trash2,
  X,
} from "lucide-react";
import { duplicateTitleError, textContent, type Note } from "@/lib/notes";
import { colors } from "@/lib/colors";
import { templates, type Template } from "@/lib/templates";
import RichEditor from "./RichEditor";
import Modal, { useDialog } from "./Modal";

type Confirmation = {
  title: string;
  text: string;
  action: () => void;
  label: string;
};

export default function NoteDrawer({
  initial,
  notes,
  onClose,
  onSave,
  onDelete,
}: {
  initial: Note;
  notes: Note[];
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const duplicate = duplicateTitleError(notes, draft.title, draft.id);

  function close() {
    if (dirty)
      setConfirmation({
        title: "Leave this sticky?",
        text: "You have unsaved changes. Discard them or keep editing.",
        action: onClose,
        label: "Discard changes",
      });
    else onClose();
  }

  const dialogRef = useDialog(close);

  function update<K extends keyof Note>(key: K, value: Note[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  // The assignment's duplicate-title check runs in an effect. Queue the state
  // update and cancel stale checks when the title changes or the drawer closes.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setError(duplicateTitleError(notes, draft.title, draft.id));
    });
    return () => {
      active = false;
    };
  }, [draft.title, draft.id, notes]);

  function changeTemplate(template: Template) {
    if (template === draft.template) return;
    const selected = templates.find((item) => item.id === template);
    if (!selected) return;
    const apply = () =>
      setDraft((previous) => ({
        ...previous,
        template,
        content: selected.content,
      }));
    if (textContent(draft.content) || /<(ul|ol)\b/i.test(draft.content))
      setConfirmation({
        title: "Switch template?",
        text: "Applying a template replaces the note content. Your title and background will stay.",
        action: apply,
        label: "Apply template",
      });
    else apply();
  }

  function save() {
    const nextError = duplicateTitleError(notes, draft.title, draft.id);
    if (!draft.title.trim() || nextError) {
      setError(nextError || "Add a title before saving.");
      return;
    }
    try {
      onSave({ ...draft, title: draft.title.trim() });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "This sticky could not be saved.",
      );
    }
  }

  return createPortal(
    <>
      <div
        className="drawer-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !confirmation) close();
        }}
      >
        <div
          className={"note-drawer " + (expanded ? "expanded" : "")}
          role="dialog"
          aria-modal="true"
          aria-label={initial.id ? "Edit sticky" : "New sticky"}
          ref={dialogRef}
          inert={Boolean(confirmation)}
        >
          <div className="drawer-controls">
            <button
              type="button"
              className="icon-button expand-button"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Shrink editor" : "Expand editor"}
              title={expanded ? "Shrink editor" : "Expand editor"}
            >
              {expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={close}
              aria-label="Close editor"
            >
              <X size={22} />
            </button>
          </div>
          <div className="drawer-body">
            <label className="visually-hidden" htmlFor="note-title">
              Title
            </label>
            <input
              id="note-title"
              className="title-input"
              placeholder="Title"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={120}
              aria-describedby={error ? "title-error" : undefined}
              aria-invalid={Boolean(error)}
              autoFocus
            />
            {error && (
              <p className="field-error" id="title-error" role="alert">
                {error}
              </p>
            )}
            <RichEditor
              content={draft.content}
              onChange={(content) => update("content", content)}
              template={draft.template}
              background={draft.background}
            />
            <div className="customization">
              <fieldset>
                <legend className="field-label">Background</legend>
                <div className="color-options">
                  {colors.map((color) => (
                    <button
                      type="button"
                      key={color.value}
                      className={
                        "color-swatch " +
                        (draft.background === color.value ? "selected" : "")
                      }
                      style={
                        { "--note-background": color.value } as CSSProperties
                      }
                      aria-label={color.name + " background"}
                      aria-pressed={draft.background === color.value}
                      title={color.name}
                      onClick={() => update("background", color.value)}
                    >
                      {draft.background === color.value && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="field-label" htmlFor="note-template">
                  Template
                </label>
                <div className="select-wrap">
                  <select
                    id="note-template"
                    value={draft.template}
                    onChange={(event) =>
                      changeTemplate(event.target.value as Template)
                    }
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>
          <div className="drawer-footer">
            {initial.id && (
              <button
                type="button"
                className="secondary-button delete-button"
                onClick={() =>
                  setConfirmation({
                    title: "Delete this sticky?",
                    text: "This note will be permanently removed from this browser.",
                    action: () => onDelete(initial.id),
                    label: "Delete sticky",
                  })
                }
              >
                <Trash2 size={17} />
                Delete
              </button>
            )}
            <button type="button" className="secondary-button" onClick={close}>
              Cancel
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!draft.title.trim() || Boolean(duplicate)}
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {confirmation && (
        <Modal title={confirmation.title} onClose={() => setConfirmation(null)}>
          <p className="modal-copy">{confirmation.text}</p>
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirmation(null)}
            >
              Keep editing
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                confirmation.action();
                setConfirmation(null);
              }}
            >
              {confirmation.label}
            </button>
          </div>
        </Modal>
      )}
    </>,
    document.body,
  );
}
