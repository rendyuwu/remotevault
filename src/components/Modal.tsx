import { createEffect, onMount, onCleanup, type JSX } from "solid-js";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  class?: string;
  label?: string;
  children: JSX.Element;
}

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export function Modal(props: ModalProps) {
  let overlayRef!: HTMLDivElement;
  let dialogRef!: HTMLDivElement;
  let previousFocus: Element | null = null;

  const trapFocus = (e: KeyboardEvent) => {
    const items = [...dialogRef.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute("disabled"));
    if (!items.length) {
      e.preventDefault();
      dialogRef.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (!props.open) return;
    if (e.key === "Escape") props.onClose();
    if (e.key === "Tab") trapFocus(e);
  };

  onMount(() => document.addEventListener("keydown", handleKeydown));
  onCleanup(() => document.removeEventListener("keydown", handleKeydown));

  createEffect(() => {
    if (props.open) {
      previousFocus = document.activeElement;
      queueMicrotask(() => dialogRef.focus());
    } else if (previousFocus instanceof HTMLElement) {
      previousFocus.focus();
    }
  });

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === overlayRef) props.onClose();
  };

  return (
    <div
      ref={overlayRef}
      class={`modal-overlay${props.open ? " show" : ""}`}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        class={`modal${props.class ? ` ${props.class}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={props.label ?? "Dialog"}
        tabindex="-1"
      >
        {props.children}
      </div>
    </div>
  );
}
