import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { MemoryRouter, Route, createMemoryHistory } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import { TopbarProvider, useTopbar } from "../components/TopbarContext";
import { SessionPage } from "./SessionPage";

function TopbarHost() {
  const { topbar } = useTopbar();
  return <header>{topbar()}</header>;
}

function renderSession(path = "/session") {
  const history = createMemoryHistory();
  history.set({ value: path, replace: true, scroll: false });
  render(() => (
    <TopbarProvider>
      <TopbarHost />
      <MemoryRouter history={history}>
        <Route path="/session" component={SessionPage} />
      </MemoryRouter>
    </TopbarProvider>
  ));
}

describe("SessionPage", () => {
  it("renders tabs, terminal output, and status bar", () => {
    renderSession();

    expect(screen.getByRole("tab", { name: /Production API/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Production Worker/ })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: /Production Windows Server/ })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: /Staging API/ })).toHaveAttribute("aria-selected", "false");

    const terminal = screen.getByLabelText("Terminal output");
    expect(within(terminal).getByText(/Last login/)).not.toBeNull();
    expect(within(terminal).getByText(/ubuntu@api-prod:~\$ systemctl status api-server/)).not.toBeNull();
    expect(within(terminal).getByText(/api-server.service - Production API Server/)).not.toBeNull();
    expect(within(terminal).getByText(/df -h \//)).not.toBeNull();
    expect(within(terminal).getByLabelText("cursor block")).toHaveTextContent("█");

    const status = screen.getByLabelText("Session status");
    ["State", "Host", "User", "Latency", "Encoding", "Size"].forEach((label) => {
      expect(within(status).getByText(label)).not.toBeNull();
    });
    expect(within(status).getByText("Connected")).not.toBeNull();
    expect(within(status).getByText("api-prod.remotevault.dev")).not.toBeNull();
    expect(within(status).getByText("ubuntu")).not.toBeNull();
    expect(within(status).getByText("18ms")).not.toBeNull();
    expect(within(status).getByText("UTF-8")).not.toBeNull();
    expect(within(status).getByText("132x34")).not.toBeNull();
  });

  it("drives terminal and status from selected tabs", () => {
    renderSession();

    fireEvent.click(screen.getByRole("tab", { name: /Production Worker/ }));
    expect(screen.getByRole("tab", { name: /Production Worker/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Connecting to worker-prod.remotevault.dev:22 as ubuntu...")).not.toBeNull();
    expect(screen.getByLabelText("Session status")).toHaveTextContent("Connecting");
    expect(screen.getByLabelText("Session status")).toHaveTextContent("worker-prod.remotevault.dev");

    fireEvent.click(screen.getByRole("tab", { name: /Production API/ }));
    expect(screen.getByRole("tab", { name: /Production API/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/api-server.service - Production API Server/)).not.toBeNull();
  });

  it("honors connection query for initial tab", () => {
    renderSession("/session?connection=prod-win");

    expect(screen.getByRole("tab", { name: /Production Windows Server/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Session status")).toHaveTextContent("Connected");
    expect(screen.getByLabelText("Session status")).toHaveTextContent("10.0.0.20");
  });

  it("shows failed overlay and non-connected status for failed tab", () => {
    renderSession();

    fireEvent.click(screen.getByRole("tab", { name: /Staging API/ }));
    expect(screen.getByRole("tab", { name: /Staging API/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText(/api-server.service - Production API Server/)).toBeNull();
    expect(screen.queryByLabelText("cursor block")).toBeNull();

    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("Connection lost")).not.toBeNull();
    expect(within(alert).getByText("staging-api.remotevault.dev:22")).not.toBeNull();
    expect(within(alert).getByText(/Connection timed out after 30s/)).not.toBeNull();
    expect(within(alert).getByRole("button", { name: "Reconnect" })).not.toBeNull();
    expect(within(alert).getByRole("button", { name: "Close tab" })).not.toBeNull();

    const status = screen.getByLabelText("Session status");
    expect(status).toHaveTextContent("Failed");
    expect(status).toHaveTextContent("deploy");
    expect(status).toHaveTextContent("timeout");
    expect(status).not.toHaveTextContent("Connected");
  });

  it("opens and closes host key demo modals", () => {
    renderSession();

    fireEvent.click(screen.getByRole("button", { name: "Demo first connect" }));
    const firstConnect = screen.getByRole("dialog", { name: "First Connect Host Key" });
    expect(firstConnect).not.toBeNull();
    expect(within(firstConnect).getAllByText("Unknown host").length).toBeGreaterThan(0);
    expect(within(firstConnect).getByText(/first time connecting to 10.0.0.10/)).not.toBeNull();
    expect(within(firstConnect).getByText("10.0.0.10:22")).not.toBeNull();
    expect(within(firstConnect).getByText(/SHA256:Nw3aB7/)).not.toBeNull();
    fireEvent.click(within(firstConnect).getByRole("button", { name: "Cancel" }));
    expect(document.querySelector(".modal-overlay.show")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Demo host key changed" }));
    const changedKey = screen.getByRole("dialog", { name: "Host Key Changed" });
    expect(changedKey).not.toBeNull();
    expect(within(changedKey).getAllByText("Host key has changed!").length).toBeGreaterThan(0);
    expect(within(changedKey).getByText(/previously trusted key/)).not.toBeNull();
    expect(within(changedKey).getByText("New fingerprint")).not.toBeNull();
    expect(within(changedKey).getByText("Previously trusted")).not.toBeNull();
    expect(within(changedKey).getByText(/SHA256:xR4k/)).not.toBeNull();
    expect(within(changedKey).getByText(/SHA256:OlDkEy/)).not.toBeNull();
    fireEvent.click(within(changedKey).getByRole("button", { name: "Reject & disconnect" }));
    expect(document.querySelector(".modal-overlay.show")).toBeNull();
  });

  it("closes tabs and preserves selection when final tab remains", () => {
    renderSession();

    fireEvent.click(screen.getByRole("button", { name: "Close Production Worker" }));
    expect(screen.queryByRole("tab", { name: /Production Worker/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Close Production API" }));
    expect(screen.getByRole("tab", { name: /Production Windows Server/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close Production Windows Server" }));
    expect(screen.getByRole("tab", { name: /Staging API/ })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close Staging API" }));
    expect(screen.getByRole("tab", { name: /Staging API/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText("Remote session workspace")).toHaveClass("session-workspace", "rise", "rise-1");
  });
});
