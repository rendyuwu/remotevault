import { render, screen, fireEvent } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("Modal", () => {
  it("focuses the dialog when opened", async () => {
    render(() => (
      <Modal open onClose={vi.fn()}>
        <button>Confirm</button>
      </Modal>
    ));

    await flush();

    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("wraps focus inside the dialog", () => {
    render(() => (
      <Modal open onClose={vi.fn()}>
        <>
          <button>First</button>
          <button>Last</button>
        </>
      </Modal>
    ));

    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(first).toHaveFocus();

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("closes on Escape and overlay click only", async () => {
    const onClose = vi.fn();
    render(() => (
      <Modal open onClose={onClose}>
        <button>Inside</button>
      </Modal>
    ));

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement!;

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("restores focus when closed", async () => {
    function ModalFixture() {
      const [open, setOpen] = createSignal(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open modal</button>
          <Modal open={open()} onClose={() => setOpen(false)}>
            <button>Close target</button>
          </Modal>
        </>
      );
    }

    render(() => <ModalFixture />);

    const trigger = screen.getByRole("button", { name: "Open modal" });
    await userEvent.click(trigger);
    await flush();

    expect(screen.getByRole("dialog")).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Close target" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveFocus();
  });
});
