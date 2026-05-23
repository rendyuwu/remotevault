import { fireEvent, render, screen } from "@solidjs/testing-library";
import { MemoryRouter, createMemoryHistory, Route } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { VaultLockedPage } from "./VaultLockedPage";

function renderLockedShell() {
  const history = createMemoryHistory();
  history.set({ value: "/vault-locked", replace: true, scroll: false });
  render(() => (
    <MemoryRouter root={App} history={history}>
      <Route path="/vault-locked" component={VaultLockedPage} />
    </MemoryRouter>
  ));
}

describe("VaultLockedPage", () => {
  it("renders in shell with locked sidebar and topbar", () => {
    renderLockedShell();

    expect(screen.getByText("Vault is locked")).not.toBeNull();
    expect(screen.getByText("Vault", { selector: ".topbar-title" })).not.toBeNull();
    expect(screen.getByText("Locked")).not.toBeNull();
    expect(screen.getByText("vault locked")).not.toBeNull();
    expect(screen.getByText("4 items encrypted · last unlocked 2h ago")).not.toBeNull();
    expect(screen.getByText("XChaCha20-Poly1305")).not.toBeNull();
  });

  it("shows error on submit and toggles passphrase visibility", () => {
    renderLockedShell();
    const input = screen.getByPlaceholderText("Master passphrase...");

    expect(screen.queryByText("Wrong passphrase. Vault remains locked.")).toBeNull();
    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Toggle master passphrase visibility" }));
    expect(input).toHaveAttribute("type", "text");

    fireEvent.submit(screen.getByRole("button", { name: "Unlock Vault" }).closest("form")!);
    expect(screen.getByText("Wrong passphrase. Vault remains locked.")).not.toBeNull();
  });
});
