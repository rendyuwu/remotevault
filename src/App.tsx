import type { ParentProps } from "solid-js";
import { useLocation } from "@solidjs/router";
import { IconSprite } from "./IconSprite";
import { Sidebar } from "./components/Sidebar";
import { TopbarProvider, useTopbar } from "./components/TopbarContext";

const ONBOARDING_ROUTES = ["/welcome", "/provider-setup", "/vault-create"];

const TITLES: Record<string, string> = {
  "/connections": "Connections",
  "/connection-edit": "Connections / Edit connection",
  "/vault": "Vault",
  "/vault-locked": "Vault",
  "/vault-edit": "Vault / Edit secret",
  "/session": "Sessions",
  "/sync": "Sync",
  "/devices": "Devices",
  "/security": "Security",
  "/settings": "Settings",
};

function ShellContent(props: ParentProps) {
  const location = useLocation();
  const { topbar } = useTopbar();
  const fallbackTitle = () => TITLES[location.pathname] ?? "RemoteVault";

  return (
    <main class="main">
      <header class="topbar">{topbar() ?? <span class="topbar-title">{fallbackTitle()}</span>}</header>
      <div class="content">{props.children}</div>
    </main>
  );
}

export function App(props: ParentProps) {
  const location = useLocation();
  const isOnboarding = () => ONBOARDING_ROUTES.includes(location.pathname);

  return (
    <TopbarProvider>
      <IconSprite />
      {isOnboarding() ? (
        <div class="center-stage">{props.children}</div>
      ) : (
        <div class="app">
          <Sidebar />
          <ShellContent>{props.children}</ShellContent>
        </div>
      )}
    </TopbarProvider>
  );
}
