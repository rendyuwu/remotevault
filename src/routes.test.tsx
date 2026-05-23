import { render, screen, waitFor } from "@solidjs/testing-library";
import { MemoryRouter, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { routes } from "./routes";

function renderRoutesAt(path: string) {
  const history = createMemoryHistory();
  history.set({ value: path, replace: true, scroll: false });
  render(() => (
    <MemoryRouter root={App} history={history}>
      {routes()}
    </MemoryRouter>
  ));
  return history;
}

describe("routes", () => {
  it("redirects root to welcome before launch", async () => {
    const history = renderRoutesAt("/");

    await waitFor(() => expect(screen.getByText("Your servers, your secrets,")).not.toBeNull());
    expect(history.get()).toBe("/welcome");
  });

  it("redirects root to connections after launch", async () => {
    localStorage.setItem("rv:launched", "1");
    const history = renderRoutesAt("/");

    await waitFor(() => expect(screen.getByText("connections")).not.toBeNull());
    expect(history.get()).toBe("/connections");
  });

  it("renders provider setup route", () => {
    renderRoutesAt("/provider-setup");

    expect(screen.getByText("Step 2 of 3 — Choose storage")).not.toBeNull();
  });

  it("renders vault create route", () => {
    renderRoutesAt("/vault-create");

    expect(screen.getByText("Create your Vault passphrase")).not.toBeNull();
  });

  it("renders vault locked route", () => {
    renderRoutesAt("/vault-locked");

    expect(screen.getByText("Vault is locked")).not.toBeNull();
  });

  it("redirects old vault edit route to vault", async () => {
    localStorage.setItem("rv:launched", "1");
    const history = renderRoutesAt("/vault-edit");

    await waitFor(() => expect(screen.getByText("Vault unlocked")).not.toBeNull());
    expect(history.get()).toBe("/vault");
  });
});
