import { render, screen } from "@solidjs/testing-library";
import { MemoryRouter, createMemoryHistory, Route } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";

function renderAt(path: string) {
  const history = createMemoryHistory();
  history.set({ value: path, replace: true, scroll: false });
  render(() => (
    <MemoryRouter history={history}>
      <Route path="*" component={Sidebar} />
    </MemoryRouter>
  ));
}

describe("Sidebar", () => {
  it("marks Connections active on edit route", () => {
    renderAt("/connection-edit");

    expect(screen.getByRole("link", { name: "Connections" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Vault" })).not.toHaveClass("active");
  });

  it("marks Vault active on edit route", () => {
    renderAt("/vault-edit");

    expect(screen.getByRole("link", { name: "Vault" })).toHaveClass("active");
    expect(screen.getByRole("link", { name: "Connections" })).not.toHaveClass("active");
  });

  it("keeps vault locked state after leaving locked route", () => {
    localStorage.setItem("rv:vaultLocked", "1");
    renderAt("/connections");

    expect(screen.getByRole("link", { name: /Vault/ })).not.toHaveClass("active");
    expect(screen.getByText("Locked")).not.toBeNull();
    expect(screen.getByText("vault locked")).not.toBeNull();
  });
});
