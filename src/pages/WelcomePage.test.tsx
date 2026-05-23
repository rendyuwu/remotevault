import { render, screen } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { WelcomePage } from "./WelcomePage";

function renderWelcome() {
  const history = createMemoryHistory();
  history.set({ value: "/welcome", replace: true, scroll: false });
  render(() => (
    <MemoryRouter history={history}>
      <Route path="/welcome" component={WelcomePage} />
    </MemoryRouter>
  ));
}

describe("WelcomePage", () => {
  it("renders exact onboarding choices and links", () => {
    renderWelcome();

    expect(screen.getByText("RemoteVault · v0.1.0 · open source")).not.toBeNull();
    expect(screen.getByText("Use locally only")).not.toBeNull();
    expect(screen.getByText("Works offline forever")).not.toBeNull();
    expect(screen.getByText("Sync with my own storage")).not.toBeNull();
    expect(screen.getByText("Local Folder, S3, R2, B2, MinIO")).not.toBeNull();
    expect(screen.getByRole("link", { name: /Continue/ })).toHaveAttribute("href", "/provider-setup");
    expect(screen.getByRole("link", { name: "Read the security model" })).toHaveAttribute("href", "/security");
  });

  it("uses rise stagger classes", () => {
    renderWelcome();

    expect(screen.getByText("RemoteVault · v0.1.0 · open source").closest(".welcome-hero")).toHaveClass("rise", "rise-1");
    expect(screen.getByRole("link", { name: /Continue/ }).parentElement).toHaveClass("rise", "rise-3");
    expect(screen.getByText("SSH/RDP sessions always connect direct.").parentElement).toHaveClass("rise", "rise-5");
  });
});
