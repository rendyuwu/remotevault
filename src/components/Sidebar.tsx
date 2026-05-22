import { For } from "solid-js";
import { useLocation, A } from "@solidjs/router";
import { Icon } from "./Icon";

const NAV_ITEMS = [
  { label: "Connections", icon: "i-server", href: "/connections", activePaths: ["/connections", "/connection-edit"] },
  { label: "Vault", icon: "i-vault", href: "/vault", activePaths: ["/vault", "/vault-edit"] },
  { label: "Sessions", icon: "i-terminal", href: "/session", activePaths: ["/session"] },
  { label: "Sync", icon: "i-sync", href: "/sync", activePaths: ["/sync"] },
  { label: "Devices", icon: "i-devices", href: "/devices", activePaths: ["/devices"] },
] as const;

const BOTTOM_ITEMS = [
  { label: "Settings", icon: "i-settings", href: "/settings", activePaths: ["/settings"] },
  { label: "Security", icon: "i-shield", href: "/security", activePaths: ["/security"] },
] as const;

export function Sidebar() {
  const location = useLocation();
  const isActive = (paths: readonly string[]) => paths.some((path) => location.pathname === path);

  return (
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="brand-mark">RV</span>
        <span class="brand-name">Remote<span class="dot">Vault</span></span>
      </div>

      <nav class="sidebar-nav">
        <For each={NAV_ITEMS}>
          {(item) => (
            <A href={item.href} class={`nav-item${isActive(item.activePaths) ? " active" : ""}`}>
              <Icon name={item.icon} />
              {item.label}
            </A>
          )}
        </For>

        <div class="sidebar-divider" />

        <For each={BOTTOM_ITEMS}>
          {(item) => (
            <A href={item.href} class={`nav-item${isActive(item.activePaths) ? " active" : ""}`}>
              <Icon name={item.icon} />
              {item.label}
            </A>
          )}
        </For>
      </nav>

      <div class="sidebar-footer">
        <div class="workspace-card">
          <div class="ws-name">
            <Icon name="i-vault" size="xs" />
            Personal Workspace
          </div>
          <div class="ws-status">
            <span class="status-dot status-dot-success" />
            vault unlocked
          </div>
        </div>
      </div>
    </aside>
  );
}
