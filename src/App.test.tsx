import { render, screen } from "@solidjs/testing-library";
import { MemoryRouter, createMemoryHistory, Route } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { App } from "./App";

function renderAppAt(path: string) {
  const history = createMemoryHistory();
  history.set({ value: path, replace: true, scroll: false });
  render(() => (
    <MemoryRouter root={App} history={history}>
      <Route path="/welcome" component={() => <div>welcome</div>} />
      <Route path="/connection-edit" component={() => <div>connection-edit</div>} />
      <Route path="/unknown" component={() => <div>unknown</div>} />
    </MemoryRouter>
  ));
}

describe("App shell", () => {
  it("renders fallback title for edit routes", () => {
    renderAppAt("/connection-edit");

    expect(screen.getByText("Connections / Edit connection")).not.toBeNull();
    expect(screen.getByText("connection-edit")).not.toBeNull();
  });

  it("falls back to product title for unmapped shell routes", () => {
    renderAppAt("/unknown");

    expect(screen.getByText("RemoteVault")).not.toBeNull();
  });

  it("uses onboarding stage without sidebar for welcome route", () => {
    renderAppAt("/welcome");

    expect(screen.getByText("welcome").parentElement).toHaveClass("center-stage");
    expect(screen.queryByRole("link", { name: "Connections" })).toBeNull();
  });
});
