import { fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { VaultCreatePage } from "./VaultCreatePage";

function renderVaultCreate() {
  const history = createMemoryHistory();
  history.set({ value: "/vault-create", replace: true, scroll: false });
  render(() => (
    <MemoryRouter history={history}>
      <Route path="/vault-create" component={VaultCreatePage} />
      <Route path="/connections" component={() => <div>connections</div>} />
    </MemoryRouter>
  ));
  return history;
}

describe("VaultCreatePage", () => {
  it("renders passphrase fields, strength, and crypto details", () => {
    renderVaultCreate();

    expect(screen.getByText("Step 3 of 3 — Vault passphrase")).not.toBeNull();
    expect(screen.getByText("Create your Vault passphrase")).not.toBeNull();
    expect(screen.getAllByDisplayValue("correct-horse-battery-staple-42")).toHaveLength(2);
    expect(screen.getByText("Strong")).not.toBeNull();
    expect(screen.getByText("5+ words or 16+ characters recommended")).not.toBeNull();
    expect(screen.getByText("No recovery possible")).not.toBeNull();
    expect(screen.getByText("Argon2id")).not.toBeNull();
    expect(screen.getByText("XChaCha20-Poly1305")).not.toBeNull();
  });

  it("toggles visibility and marks launch complete", async () => {
    const history = renderVaultCreate();
    const input = screen.getByPlaceholderText("Enter a strong passphrase...");

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Toggle master passphrase visibility" }));
    expect(input).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: /Create workspace/ }));
    expect(localStorage.getItem("rv:launched")).toBe("1");
    await waitFor(() => expect(history.get()).toBe("/connections"));
  });
});
