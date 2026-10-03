import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

export function noteEditorExtensions() {
  return [
    StarterKit.configure({ underline: false }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"], defaultAlignment: "left" }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder: "Description" }),
  ];
}
