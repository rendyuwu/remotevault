import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { TopbarProvider, useTopbar } from "../components/TopbarContext";
import { ConnectionEditPage } from "./ConnectionEditPage";

function TopbarHost() {
  const { topbar } = useTopbar();
  return <header>{topbar()}</header>;
}

function renderConnectionEdit() {
  const history = createMemoryHistory();
  history.set({ value: "/connection-edit", replace: true, scroll: false });
  render(() => (
    <TopbarProvider>
      <TopbarHost />
      <MemoryRouter history={history}>
        <Route path="/connection-edit" component={ConnectionEditPage} />
        <Route path="/connections" component={() => <div>connections</div>} />
      </MemoryRouter>
    </TopbarProvider>
  ));
  return history;
}

describe("ConnectionEditPage", () => {
  it("renders breadcrumb, title, and basic connection fields", () => {
    renderConnectionEdit();

    expect(screen.getByRole("link", { name: "Connections" })).toHaveAttribute("href", "/connections");
    expect(screen.getByText("Edit Connection")).not.toBeNull();
    expect(screen.getByText("Connection Profile")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Production API Server" })).not.toBeNull();
    expect(screen.getByLabelText("Name")).toHaveValue("Production API Server");
    expect(screen.getByLabelText("Host")).toHaveValue("10.0.0.10");
    expect(screen.getByLabelText("Port")).toHaveValue("22");
    expect(screen.getByLabelText("Username")).toHaveValue("ubuntu");
    expect(screen.getByLabelText("Folder")).toHaveValue("Production");

    fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Renamed API" } });
    fireEvent.input(screen.getByLabelText("Host"), { target: { value: "10.0.0.12" } });
    fireEvent.input(screen.getByLabelText("Folder"), { target: { value: "Staging" } });

    expect(screen.getByLabelText("Name")).toHaveValue("Renamed API");
    expect(screen.getByLabelText("Host")).toHaveValue("10.0.0.12");
    expect(screen.getByLabelText("Folder")).toHaveValue("Staging");
  });

  it("shows SSH defaults, auth choices, and SSH vault picker", () => {
    renderConnectionEdit();

    const protocolGroup = screen.getByRole("radiogroup", { name: "Protocol" });
    expect(within(protocolGroup).getByRole("radio", { name: "SSH" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("heading", { name: "SSH authentication" })).not.toBeNull();

    const authGroup = screen.getByRole("radiogroup", { name: "Authentication method" });
    expect(within(authGroup).getByRole("radio", { name: "Private Key" })).toHaveAttribute("aria-checked", "true");
    ["Password", "SSH Agent"].forEach((label) => {
      fireEvent.click(within(authGroup).getByRole("radio", { name: label }));
      expect(within(authGroup).getByRole("radio", { name: label })).toHaveAttribute("aria-checked", "true");
    });

    expect(screen.getByLabelText("Private key from Vault")).not.toBeNull();
    expect(screen.getByLabelText("Key passphrase from Vault")).not.toBeNull();
    expect(screen.getByText("Production SSH Key (ed25519)")).not.toBeNull();
    expect(screen.getByText("Staging SSH Key (rsa)")).not.toBeNull();
    expect(screen.getByText("SSH Key Passphrase")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Staging SSH Key \(rsa\)/ }));
    expect(screen.getByRole("button", { name: /Staging SSH Key \(rsa\)/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches to RDP fieldset and vault picker", () => {
    renderConnectionEdit();

    fireEvent.click(screen.getByRole("radio", { name: "RDP" }));
    expect(screen.getByRole("radio", { name: "RDP" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("heading", { name: "SSH authentication" })).toBeNull();
    expect(screen.getByRole("heading", { name: "RDP settings" })).not.toBeNull();
    expect(screen.getByLabelText("Port")).toHaveValue("3389");
    expect(screen.getByLabelText("Username")).toHaveValue("Administrator");
    expect(screen.getByLabelText("Domain")).toHaveValue("PROD");
    expect(screen.getByLabelText("Screen size")).toHaveValue("Auto (match window)");
    expect(screen.getByLabelText("Certificate validation")).toHaveValue("Warn on invalid certificate");
    fireEvent.change(screen.getByLabelText("Screen size"), { target: { value: "1920 × 1080" } });
    fireEvent.change(screen.getByLabelText("Certificate validation"), { target: { value: "Reject invalid certificate" } });
    expect(screen.getByLabelText("Screen size")).toHaveValue("1920 × 1080");
    expect(screen.getByLabelText("Certificate validation")).toHaveValue("Reject invalid certificate");
    expect(screen.getByRole("switch", { name: "Fullscreen" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Clipboard" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: "Audio" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("button", { name: /Windows Admin Password/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders metadata and actions", () => {
    renderConnectionEdit();

    expect(screen.getByRole("heading", { name: "Metadata" })).not.toBeNull();
    expect(screen.getByLabelText("Tags")).toHaveValue("production, api, linux");
    fireEvent.input(screen.getByLabelText("Tags"), { target: { value: "production, api, renamed" } });
    expect(screen.getByLabelText("Tags")).toHaveValue("production, api, renamed");
    expect(screen.getByRole("switch", { name: "Sync this connection across devices" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("switch", { name: "Sync this connection across devices" }));
    expect(screen.getByRole("switch", { name: "Sync this connection across devices" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText("Notes")).toHaveValue("Main API server. Runs behind Cloudflare tunnel. Restart with systemctl restart api.");
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/connections");
    expect(screen.getByRole("button", { name: "Save connection" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Delete" })).not.toBeNull();
  });

  it("uses editor, form, vault picker, action, and rise classes", () => {
    renderConnectionEdit();

    expect(document.querySelector(".vault-editor-panel")).not.toBeNull();
    expect(document.querySelector(".form-grid")).not.toBeNull();
    expect(document.querySelector(".field-row")).not.toBeNull();
    expect(document.querySelector(".vault-picker")).not.toBeNull();
    expect(document.querySelector(".form-actions")).not.toBeNull();
    expect(document.querySelector(".rise.rise-1")).not.toBeNull();
    expect(document.querySelector(".rise.rise-2")).not.toBeNull();
  });
});
