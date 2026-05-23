import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { TopbarProvider, useTopbar } from "../components/TopbarContext";
import { VaultPage } from "./VaultPage";

function TopbarHost() {
  const { topbar } = useTopbar();
  return <header>{topbar()}</header>;
}

function renderVault() {
  const history = createMemoryHistory();
  history.set({ value: "/vault", replace: true, scroll: false });
  render(() => (
    <TopbarProvider>
      <TopbarHost />
      <MemoryRouter history={history}>
        <Route path="/vault" component={VaultPage} />
        <Route path="/vault-locked" component={() => <div>locked</div>} />
      </MemoryRouter>
    </TopbarProvider>
  ));
}

describe("VaultPage", () => {
  it("renders vault status, filters, and full-width pill grid", () => {
    renderVault();

    expect(screen.getByText("Vault unlocked")).not.toBeNull();
    expect(screen.getByText("Secrets are decrypted in memory")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Lock now" })).toHaveAttribute("href", "/vault-locked");
    const filters = screen.getByLabelText("Vault filters");
    ["All", "Passwords", "Private Keys", "Passphrases", "Generic"].forEach((label) => {
      expect(within(filters).getByRole("button", { name: label })).not.toBeNull();
    });
    ["Production RDP Password", "Production SSH Key (ed25519)", "SSH Key Passphrase", "Staging API Token"].forEach((name) => {
      expect(screen.getByText(name)).not.toBeNull();
    });
    expect(document.querySelector(".pill-grid")).not.toBeNull();
    expect(document.querySelector(".content-narrow")).toBeNull();
    expect(document.querySelector(".rise.rise-1")).not.toBeNull();
    expect(document.querySelector(".rise.rise-2")).not.toBeNull();
    expect(document.querySelector(".rise.rise-3")).not.toBeNull();
  });

  it("filters visible secrets and opens add modal", () => {
    renderVault();

    const filters = screen.getByLabelText("Vault filters");
    fireEvent.click(within(filters).getByRole("button", { name: "Private Keys" }));
    expect(within(filters).getByRole("button", { name: "Private Keys" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Production SSH Key (ed25519)")).not.toBeNull();
    expect(screen.queryByText("Production RDP Password")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Add secret/ }));
    expect(screen.getByRole("dialog", { name: "Add Secret" })).not.toBeNull();
    expect(screen.getByText("Password")).not.toBeNull();
    expect(screen.getByLabelText("Name")).not.toBeNull();
    expect(screen.getByLabelText("Secret value")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.querySelector(".modal-overlay.show")).toBeNull();
  });
});
