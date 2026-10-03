export type Template = "blank" | "lines" | "grid" | "checklist" | "meeting";

export const templates: { id: Template; name: string; content: string }[] = [
  { id: "blank", name: "Blank", content: "<p></p>" },
  { id: "lines", name: "Lines", content: "<p></p>" },
  { id: "grid", name: "Grid", content: "<p></p>" },
  {
    id: "checklist", name: "Checklist",
    content: '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li><li data-type="taskItem" data-checked="false"><p></p></li></ul>',
  },
  {
    id: "meeting", name: "Brief Meeting",
    content: "<h2>Date</h2><p></p><h2>Attendees</h2><p></p><h2>Agenda</h2><p></p><h2>Notes</h2><p></p><h2>Action Items</h2><p></p>",
  },
];
