"use client";

import { useEffect, useRef, type RefObject, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const dialogStack: RefObject<HTMLDivElement | null>[] = [];
let originalOverflow = "";

export function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    if (dialogStack.length === 0)
      originalOverflow = document.body.style.overflow;
    dialogStack.push(ref);
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      if (dialogStack.at(-1) !== ref) return;
      const firstInput = ref.current?.querySelector<HTMLElement>(
        "input:not(:disabled)",
      );
      (
        firstInput ||
        ref.current?.querySelector<HTMLElement>("button:not(:disabled)")
      )?.focus();
    }, 0);

    function onKey(event: KeyboardEvent) {
      if (dialogStack.at(-1) !== ref) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const elements = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [contenteditable="true"], [tabindex="0"]',
          ) || [],
        ).filter((element) => element.getClientRects().length > 0);
        const first = elements[0],
          last = elements.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            !ref.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          last?.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !ref.current?.contains(document.activeElement))
        ) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKey);
      const index = dialogStack.indexOf(ref);
      if (index !== -1) dialogStack.splice(index, 1);
      if (dialogStack.length === 0)
        document.body.style.overflow = originalOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return ref;
}

export default function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useDialog(onClose);
  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
