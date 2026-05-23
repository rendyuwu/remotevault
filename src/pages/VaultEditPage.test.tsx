import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { TopbarProvider, useTopbar } from "../components/TopbarContext";
import { VaultEditPage } from "./VaultEditPage";

function TopbarHost() {
  const { topbar } = useTopbar();
  return <header>{topbar()}</header>;
}

function renderVaultEdit() {
  const history = createMemoryHistory();
  history.set({ value: "/vault-edit", replace: true, scroll: false });
  render(() => (
    <TopbarProvider>
      <TopbarHost />
      <MemoryRouter history={history}>
        <Route path="/vault-edit" component={VaultEditPage} />
        <Route path="/vault" component={() => <div>vault</div>} />
      </MemoryRouter>
    </TopbarProvider>
  ));
}

describe("VaultEditPage", () => {
  it("renders breadcrumb, secret fields, tags, and linked connections", () => {
    renderVaultEdit();

    expect(screen.getByRole("link", { name: "Vault" })).toHaveAttribute("href", "/vault");
    expect(screen.getByText("Edit Item")).not.toBeNull();
    expect(screen.getByText("Vault Item")).not.toBeNull();
    expect(screen.getByText("Production SSH Key (ed25519)")).not.toBeNull();
    expect(screen.getByLabelText("Name")).toHaveAttribute("value", "Production SSH Key (ed25519)");
    expect(screen.getByText("#production")).not.toBeNull();
    expect(screen.getByText("#ssh")).not.toBeNull();
    expect(screen.getByText("#ed25519")).not.toBeNull();
    expect(screen.getByDisplayValue(/Generated 2026-01-15/)).not.toBeNull();
    ["Production API Server", "Production Worker", "Production DB Bastion", "10.0.0.10:22", "10.0.0.11:22", "10.0.0.5:22"].forEach((text) => {
      expect(screen.getByText(text)).not.toBeNull();
    });
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/vault");
  });

  it("changes active type, toggles reveal, and uses rise stagger", () => {
    renderVaultEdit();

    const typeSelector = screen.getByLabelText("Secret type");
    expect(within(typeSelector).getByRole("button", { name: "Private Key" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(typeSelector).getByRole("button", { name: "Generic" }));
    expect(within(typeSelector).getByRole("button", { name: "Generic" })).toHaveAttribute("aria-pressed", "true");

    const secretWrap = screen.getByLabelText("Secret value").parentElement!;
    expect(secretWrap).toHaveClass("hidden");
    fireEvent.click(screen.getByRole("button", { name: "Reveal secret value" }));
    expect(secretWrap).toHaveClass("revealed");
    expect(screen.getByRole("button", { name: "Hide secret value" })).not.toBeNull();

    [1, 2, 3, 4, 5].forEach((n) => {
      expect(document.querySelector(`.rise.rise-${n}`)).not.toBeNull();
    });
  });
});
