import type { ParentProps } from "solid-js";
import { useLocation } from "@solidjs/router";
import { IconSprite } from "./IconSprite";
import { Sidebar } from "./components/Sidebar";
import { TopbarProvider, useTopbar } from "./components/TopbarContext";

const ONBOARDING_ROUTES = ["/welcome", "/provider-setup", "/vault-create", "/vault-locked"];

function ShellContent(props: ParentProps) {
  const { topbar } = useTopbar();
  return (
    <main class="main">
      <header class="topbar">{topbar()}</header>
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
