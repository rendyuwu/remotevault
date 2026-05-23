import { fireEvent, render, screen, waitFor, within } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { TopbarProvider, useTopbar } from "../components/TopbarContext";
import { ConnectionsPage } from "./ConnectionsPage";

function TopbarHost() {
  const { topbar } = useTopbar();
  return <header>{topbar()}</header>;
}

function renderConnections() {
  const history = createMemoryHistory();
  history.set({ value: "/connections", replace: true, scroll: false });
  render(() => (
    <TopbarProvider>
      <TopbarHost />
      <MemoryRouter history={history}>
        <Route path="/connections" component={ConnectionsPage} />
        <Route path="/session" component={() => <div>session</div>} />
      </MemoryRouter>
    </TopbarProvider>
  ));
  return history;
}

const names = [
  "Production API Server",
  "Production Worker",
  "Production DB Bastion",
  "Production Windows Server",
  "Staging API",
  "Staging Windows",
  "Homelab NAS",
];

describe("ConnectionsPage", () => {
  it("renders topbar actions, folders, filters, and full-width grid", () => {
    renderConnections();

    expect(document.querySelector(".topbar-title")).toHaveTextContent("Connections");
    expect(screen.getByLabelText("Search connections")).not.toBeNull();
    expect(screen.getByRole("button", { name: /New connection/ })).not.toBeNull();

    const breadcrumb = screen.getByLabelText("Connection breadcrumb");
    expect(screen.getByRole("button", { name: "Open connection folder menu" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Open production folder menu" })).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".breadcrumb-dropdown.open")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open connection folder menu" }));
    expect(screen.getByRole("button", { name: "Open connection folder menu" })).toHaveAttribute("aria-expanded", "true");
    ["All Connections", "Production", "Staging", "Homelab"].forEach((label) => {
      expect(within(breadcrumb).getAllByText(new RegExp(label)).length).toBeGreaterThan(0);
    });

    const filters = screen.getByLabelText("Connection filters");
    ["All", "SSH", "RDP"].forEach((label) => {
      expect(within(filters).getByRole("button", { name: label })).not.toBeNull();
    });

    const grid = document.querySelector(".pill-grid")!;
    names.forEach((name) => expect(within(grid as HTMLElement).getByText(name)).not.toBeNull());
    expect(document.querySelector(".content-narrow")).toBeNull();
    expect(document.querySelector(".rise.rise-1")).not.toBeNull();
    expect(document.querySelector(".rise.rise-2")).not.toBeNull();
    expect(document.querySelector(".rise.rise-3")).not.toBeNull();
  });

  it("filters connections by protocol and search query", () => {
    renderConnections();

    const filters = screen.getByLabelText("Connection filters");
    fireEvent.click(within(filters).getByRole("button", { name: "RDP" }));

    expect(within(filters).getByRole("button", { name: "RDP" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Production Windows Server")).not.toBeNull();
    expect(screen.getByText("Staging Windows")).not.toBeNull();
    expect(screen.queryByText("Production API Server")).toBeNull();

    fireEvent.input(screen.getByPlaceholderText("Search connections..."), { target: { value: "staging" } });

    expect(screen.getByText("Staging Windows")).not.toBeNull();
    expect(screen.queryByText("Production Windows Server")).toBeNull();
  });

  it("links edit selected to selected connection", () => {
    renderConnections();
    const grid = document.querySelector(".pill-grid")!;
    const worker = within(grid as HTMLElement).getByText("Production Worker").closest('[role="button"]')!;

    fireEvent.click(worker);

    expect(screen.getByRole("link", { name: "Edit selected" })).toHaveAttribute("href", "/connection-edit?id=prod-worker");
  });

  it("selects on single-click and navigates to session on double-click", async () => {
    renderConnections();
    const grid = document.querySelector(".pill-grid")!;
    const worker = within(grid as HTMLElement).getByText("Production Worker").closest('[role="button"]')!;

    fireEvent.click(worker);
    expect(worker).toHaveClass("active");

    fireEvent.dblClick(worker);
    await waitFor(() => expect(screen.getByText("session")).not.toBeNull());
  });

  it("resets add modal draft when reopened", () => {
    renderConnections();

    fireEvent.click(screen.getByRole("button", { name: /New connection/ }));
    expect(screen.getByRole("dialog", { name: "Add Connection" })).not.toBeNull();
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Host")).toHaveValue("");

    fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Typed connection" } });
    fireEvent.input(screen.getByLabelText("Host"), { target: { value: "typed.example" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    fireEvent.click(screen.getByRole("button", { name: /New connection/ }));
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Host")).toHaveValue("");
  });

  it("prefills edit modal for existing connections", () => {
    renderConnections();
    const grid = document.querySelector(".pill-grid")!;
    const api = within(grid as HTMLElement).getByText("Production API Server").closest('[role="button"]')!;

    fireEvent.click(within(api as HTMLElement).getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("dialog", { name: "Edit Connection" })).not.toBeNull();
    expect(screen.getByLabelText("Name")).toHaveValue("Production API Server");
    expect(screen.getByLabelText("Host")).toHaveValue("10.0.0.10");
    expect(screen.getByLabelText("Port")).toHaveValue("22");
    expect(screen.getByLabelText("Username")).toHaveValue("ubuntu");
    expect(screen.getByLabelText("Folder")).toHaveValue("Production");
    expect(screen.getByRole("button", { name: "Save changes" })).not.toBeNull();
  });

  it("shows connection-specific conflict text for conflict item", () => {
    renderConnections();
    const grid = document.querySelector(".pill-grid")!;
    const conflict = within(grid as HTMLElement).getByText("Staging API").closest('[role="button"]')!;

    fireEvent.dblClick(conflict);

    expect(screen.getByRole("dialog", { name: "Resolve Connection Conflict" })).not.toBeNull();
    expect(screen.getByText("Resolve Connection Conflict")).not.toBeNull();
    expect(screen.getByText(/connection settings changed on two devices/)).not.toBeNull();
    expect(screen.getByText("staging-new.example.com")).not.toBeNull();
    expect(screen.getByText("Local connection")).not.toBeNull();
    expect(screen.getByText("Remote connection")).not.toBeNull();
  });
});
