import { onMount, onCleanup, type JSX } from "solid-js";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  class?: string;
  children: JSX.Element;
}

export function Modal(props: ModalProps) {
  let overlayRef!: HTMLDivElement;

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.open) props.onClose();
  };

  onMount(() => document.addEventListener("keydown", handleKeydown));
  onCleanup(() => document.removeEventListener("keydown", handleKeydown));

  const handleOverlayClick = (e: MouseEvent) => {
    if (e.target === overlayRef) props.onClose();
  };

  return (
    <div
      ref={overlayRef}
      class={`modal-overlay${props.open ? " show" : ""}`}
      onClick={handleOverlayClick}
    >
      <div class={`modal${props.class ? ` ${props.class}` : ""}`}>
        {props.children}
      </div>
    </div>
  );
}
