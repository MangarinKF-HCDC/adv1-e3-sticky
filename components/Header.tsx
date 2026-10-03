"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Plus, Search, X } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

type HeaderProps = {
  searchQuery: string;
  isSearchOpen: boolean;
  onSearch: (query: string) => void;
  onToggleSearch: () => void;
  onCreate: () => void;
  loaded: boolean;
  theme: string;
  onToggleTheme: () => void;
};

export default function Header({
  searchQuery,
  isSearchOpen,
  onSearch,
  onToggleSearch,
  onCreate,
  loaded,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isSearchOpen) searchRef.current?.focus();
  }, [isSearchOpen]);

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link href="/" aria-label="Sticky home">
          <Logo />
        </Link>
      </div>
      <div className="header-actions">
        {isSearchOpen && (
          <div className="search-box" id="notes-search">
            <input
              ref={searchRef}
              type="search"
              aria-label="Search notes"
              placeholder="Search your stickies…"
              value={searchQuery}
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
        )}
        <button
          type="button"
          className="icon-button search-toggle"
          aria-label={isSearchOpen ? "Close search" : "Open search"}
          aria-expanded={isSearchOpen}
          aria-controls={isSearchOpen ? "notes-search" : undefined}
          onClick={onToggleSearch}
        >
          {isSearchOpen ? <X size={20} /> : <Search size={20} />}
        </button>
        <button
          type="button"
          className="primary-button header-create-button"
          title="Create"
          onClick={onCreate}
          disabled={!loaded}
        >
          <Plus size={18} />
          <span>Create</span>
        </button>
        <span className="header-divider" />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
