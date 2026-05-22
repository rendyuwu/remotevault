import { For } from "solid-js";
import { useLocation, A } from "@solidjs/router";
import { Icon } from "./Icon";

const NAV_ITEMS = [
  { label: "Connections", icon: "i-server", href: "/connections" },
  { label: "Vault", icon: "i-vault", href: "/vault" },
  { label: "Sessions", icon: "i-terminal", href: "/session" },
  { label: "Sync", icon: "i-sync", href: "/sync" },
  { label: "Devices", icon: "i-devices", href: "/devices" },
] as const;

const BOTTOM_ITEMS = [
  { label: "Settings", icon: "i-settings", href: "/settings" },
  { label: "Security", icon: "i-shield", href: "/security" },
] as const;

export function Sidebar() {
  const location = useLocation();
  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "-");

  return (
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="brand-mark">RV</span>
        <span class="brand-name">Remote<span class="dot">Vault</span></span>
      </div>

      <nav class="sidebar-nav">
        <For each={NAV_ITEMS}>
          {(item) => (
            <A href={item.href} class={`nav-item${isActive(item.href) ? " active" : ""}`}>
              <Icon name={item.icon} />
              {item.label}
            </A>
          )}
        </For>

        <div class="sidebar-divider" />

        <For each={BOTTOM_ITEMS}>
          {(item) => (
            <A href={item.href} class={`nav-item${isActive(item.href) ? " active" : ""}`}>
              <Icon name={item.icon} />
              {item.label}
            </A>
          )}
        </For>
      </nav>

      <div class="sidebar-footer">
        <div class="workspace-card">
          <div class="ws-name">
            <Icon name="i-vault" size={12} />
            Personal Workspace
          </div>
          <div class="ws-status">
            <span style="width:6px;height:6px;border-radius:50%;background:var(--success);display:inline-block" />
            vault unlocked
          </div>
        </div>
      </div>
    </aside>
  );
}
