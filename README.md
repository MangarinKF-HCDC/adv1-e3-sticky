# Sticky

A simple local notepad built with Next.js, React, Tiptap, and Tailwind. Notes are stored in this browser through localStorage.

## Features

- Add, view, edit, and delete notes with duplicate-title validation.
- Search titles and note content.
- Bold, italic, underline, strike, left/center/right alignment, lists, and checklists.
- Six background colors and Blank, Lines, Grid, Checklist, and Brief Meeting templates.
- Light/dark mode with a saved preference and a Create a sticky button in the header.
- Responsive square cards and an expandable drawer with unsaved-change and deletion confirmations.

The app state and CRUD logic live in app/page.tsx. NoteCard remains a separate component. Existing note bodies, checklists, and old descriptions migrate into the simplified six-field data model.

## Run

Use Node.js 22.22.2+, 24.15+, or 26+.

    npm install
    npm run dev

Open http://localhost:3000. Production builds use a network connection to load Inter and Poppins through next/font.

## Check

    npm run lint
    npm test
    npm run build

Tests cover CRUD, duplicate titles, search, storage migration, and Tiptap formatting/checklist/alignment persistence in a simulated DOM. No browser installation is needed for these tests.

## Recording checklist

1. Toggle dark mode, then return to light.
2. Create a note with formatting, alignment, a checklist, a template, and a background.
3. Show the duplicate-title error.
4. Search for a word from the note body.
5. Edit and save a note.
6. Reload to confirm persistence.
7. Delete the note after confirmation.
8. Show the header Create a sticky button and phone layout.
