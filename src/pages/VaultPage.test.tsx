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
        <Route path="/vault-edit" component={() => <div>edit</div>} />
        <Route path="/vault-locked" component={() => <div>locked</div>} />
      </MemoryRouter>
    </TopbarProvider>
  ));
  return history;
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
    const grid = document.querySelector(".pill-grid")!;
    ["Production RDP Password", "Production SSH Key (ed25519)", "SSH Key Passphrase", "Staging API Token"].forEach((name) => {
      expect(within(grid as HTMLElement).getByText(name)).not.toBeNull();
    });
    ["password", "private_key", "passphrase", "generic"].forEach((subtitle) => {
      expect(within(grid as HTMLElement).getByText(subtitle)).not.toBeNull();
    });
    expect(grid).not.toBeNull();
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
    expect(screen.getByLabelText("Name")).toHaveAttribute("placeholder", "e.g. Production RDP Password");
    expect(screen.getByLabelText("Secret value")).toHaveAttribute("placeholder", "Enter secret value...");
    expect(screen.getByLabelText("Tags")).toHaveAttribute("placeholder", "production, ssh, linux");
    expect(screen.getByLabelText("Notes")).toHaveAttribute("placeholder", "Optional notes about this secret...");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(document.querySelector(".modal-overlay.show")).toBeNull();
  });

  it("opens conflict modal for conflicted secret and prefilled edit modal for normal secret", () => {
    renderVault();

    const grid = document.querySelector(".pill-grid")!;
    const conflictPill = within(grid as HTMLElement).getByText("SSH Key Passphrase").closest('[role="button"]')!;
    fireEvent.dblClick(conflictPill);
    expect(screen.getByRole("dialog", { name: "Resolve Vault Conflict" })).not.toBeNull();
    expect(screen.getByText("Local (MacBook Pro)")).not.toBeNull();
    expect(screen.getByText("Remote (Desktop)")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Keep Both" })).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Keep Local" }));
    const normalPill = within(grid as HTMLElement).getByText("Production RDP Password").closest('[role="button"]')!;
    fireEvent.click(within(normalPill as HTMLElement).getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("dialog", { name: "Edit Secret" })).not.toBeNull();
    expect(screen.getByLabelText("Name")).toHaveValue("Production RDP Password");
    expect(screen.getByLabelText("Secret value")).toHaveTextContent("••••••••••••");
    expect(screen.getByLabelText("Tags")).toHaveValue("production, rdp, windows");
    expect(screen.getByLabelText("Notes")).toHaveTextContent("Administrator password for production Windows hosts.");
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeNull();
  });
});
