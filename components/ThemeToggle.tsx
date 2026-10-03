"use client";

import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: string;
  onToggle: () => void;
}) {
  const label =
    theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
