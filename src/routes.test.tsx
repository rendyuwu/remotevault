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

    await waitFor(() => expect(screen.getByText("welcome")).not.toBeNull());
    expect(history.get()).toBe("/welcome");
  });

  it("redirects root to connections after launch", async () => {
    localStorage.setItem("rv:launched", "1");
    const history = renderRoutesAt("/");

    await waitFor(() => expect(screen.getByText("connections")).not.toBeNull());
    expect(history.get()).toBe("/connections");
  });
});
