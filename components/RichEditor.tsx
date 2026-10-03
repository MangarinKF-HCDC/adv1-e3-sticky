"use client";

import { useEffect, type CSSProperties } from "react";
import { noteEditorExtensions } from "@/lib/editor";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react";

export default function RichEditor({
  content,
  onChange,
  template,
  background,
}: {
  content: string;
  onChange: (value: string) => void;
  template: string;
  background: string;
}) {
  const editor = useEditor({
    extensions: noteEditorExtensions(),
    content,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        "aria-label": "Description",
        role: "textbox",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      underline: editor?.isActive("underline"),
      strike: editor?.isActive("strike"),
      left: editor?.isActive({ textAlign: "left" }),
      center: editor?.isActive({ textAlign: "center" }),
      right: editor?.isActive({ textAlign: "right" }),
      bullets: editor?.isActive("bulletList"),
      numbers: editor?.isActive("orderedList"),
      checklist: editor?.isActive("taskList"),
    }),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML())
      editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  const groups = [
    [
      {
        label: "Bold",
        Icon: Bold,
        active: active?.bold,
        run: () => editor?.chain().focus().toggleBold().run(),
      },
      {
        label: "Italic",
        Icon: Italic,
        active: active?.italic,
        run: () => editor?.chain().focus().toggleItalic().run(),
      },
      {
        label: "Underline",
        Icon: Underline,
        active: active?.underline,
        run: () => editor?.chain().focus().toggleUnderline().run(),
      },
      {
        label: "Strike",
        Icon: Strikethrough,
        active: active?.strike,
        run: () => editor?.chain().focus().toggleStrike().run(),
      },
    ],
    [
      {
        label: "Align left",
        Icon: AlignLeft,
        active: active?.left,
        run: () => editor?.chain().focus().setTextAlign("left").run(),
      },
      {
        label: "Align center",
        Icon: AlignCenter,
        active: active?.center,
        run: () => editor?.chain().focus().setTextAlign("center").run(),
      },
      {
        label: "Align right",
        Icon: AlignRight,
        active: active?.right,
        run: () => editor?.chain().focus().setTextAlign("right").run(),
      },
    ],
    [
      {
        label: "Bullets",
        Icon: List,
        active: active?.bullets,
        run: () => editor?.chain().focus().toggleBulletList().run(),
      },
      {
        label: "Numbers",
        Icon: ListOrdered,
        active: active?.numbers,
        run: () => editor?.chain().focus().toggleOrderedList().run(),
      },
      {
        label: "Checklist",
        Icon: ListChecks,
        active: active?.checklist,
        run: () => editor?.chain().focus().toggleTaskList().run(),
      },
    ],
  ];

  return (
    <div className="editor-wrap">
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        {groups.map((buttons, index) => (
          <div
            key={index}
            className="editor-tool-group"
            role="group"
            aria-label={["Text style", "Text alignment", "Lists"][index]}
          >
            {buttons.map(({ label, Icon, active: pressed, run }) => (
              <button
                key={label}
                type="button"
                disabled={!editor}
                aria-label={label}
                title={label}
                aria-pressed={Boolean(pressed)}
                className={"icon-button " + (pressed ? "active" : "")}
                onClick={run}
              >
                <Icon size={17} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <div
        className={"editor-paper paper-" + template}
        style={{ "--note-background": background } as CSSProperties}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
