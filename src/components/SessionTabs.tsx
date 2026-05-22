import { For } from "solid-js";
import { Icon } from "./Icon";

type TabState = "connected" | "connecting" | "failed" | "disconnected";

interface SessionTab {
  id: string;
  name: string;
  protocol: "ssh" | "rdp";
  state: TabState;
}

interface SessionTabsProps {
  tabs: SessionTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export function SessionTabs(props: SessionTabsProps) {
  return (
    <div class="session-tabs" role="tablist">
      <For each={props.tabs}>
        {(tab) => (
          <div class="session-tab-wrap" role="presentation">
            <button
              type="button"
              role="tab"
              aria-selected={tab.id === props.activeId}
              class={`session-tab${tab.id === props.activeId ? " active" : ""}`}
              onClick={() => props.onSelect(tab.id)}
            >
              <span class={`tab-proto ${tab.protocol}`}>{tab.protocol.toUpperCase()}</span>
              <span>{tab.name}</span>
              <span class={`tab-state ${tab.state}`} />
            </button>
            <button
              type="button"
              class="tab-close"
              aria-label={`Close ${tab.name}`}
              onClick={() => props.onClose(tab.id)}
            >
              <Icon name="i-x" size="2xs" />
            </button>
          </div>
        )}
      </For>
    </div>
  );
}
