import { fireEvent, render, screen } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { ProviderSetupPage } from "./ProviderSetupPage";

function renderProviderSetup() {
  const history = createMemoryHistory();
  history.set({ value: "/provider-setup", replace: true, scroll: false });
  render(() => (
    <MemoryRouter history={history}>
      <Route path="/provider-setup" component={ProviderSetupPage} />
    </MemoryRouter>
  ));
}

describe("ProviderSetupPage", () => {
  it("renders local folder config by default", () => {
    renderProviderSetup();

    expect(screen.getByText("Step 2 of 3 — Choose storage")).not.toBeNull();
    expect(screen.getByText("Where should encrypted data sync?")).not.toBeNull();
    expect(screen.getByDisplayValue("/Users/simon/Sync/remotevault")).not.toBeNull();
    expect(screen.getByText("Browse")).not.toBeNull();
    expect(screen.getByText("Folder exists, writable, no existing workspace found. Ready to initialize.")).not.toBeNull();
    expect(screen.queryByText("Configure S3-Compatible Storage")).toBeNull();
  });

  it("switches to S3 config and toggles presets", () => {
    renderProviderSetup();

    fireEvent.click(screen.getByRole("radio", { name: /S3-Compatible/ }));

    expect(screen.queryByText("Configure Local Folder")).toBeNull();
    expect(screen.getByText("Configure S3-Compatible Storage")).not.toBeNull();
    expect(screen.getByPlaceholderText("https://s3.us-east-1.amazonaws.com")).not.toBeNull();
    expect(screen.getByText("Testing bucket access... checking write + list permissions.")).not.toBeNull();

    const minio = screen.getByRole("radio", { name: "MinIO" });
    fireEvent.click(minio);
    expect(minio).toHaveClass("active");
  });

  it("toggles workspace preset and links forward", () => {
    renderProviderSetup();

    const existing = screen.getByRole("radio", { name: "Open existing workspace" });
    fireEvent.click(existing);

    expect(existing).toHaveClass("active");
    expect(screen.getByText("Zero-knowledge sync")).not.toBeNull();
    expect(screen.getByRole("link", { name: /Continue to Vault setup/ })).toHaveAttribute("href", "/vault-create");
  });
});
