import { For } from "solid-js";
import { Icon } from "./Icon";

interface VaultItem {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface VaultPickerProps {
  items: VaultItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function VaultPicker(props: VaultPickerProps) {
  return (
    <div class="vault-picker">
      <div class="vault-picker-header">
        <h4>
          <Icon name="i-key" size="xs" />
          Linked Secrets
        </h4>
      </div>
      <div class="vault-picker-list">
        <For each={props.items}>
          {(item) => (
            <button
              type="button"
              class={`vault-picker-item${item.id === props.selectedId ? " selected" : ""}`}
              aria-pressed={item.id === props.selectedId}
              onClick={() => props.onSelect(item.id)}
            >
              <span class="vp-icon"><Icon name={item.icon} size="xs" /></span>
              <span>
                <span class="vp-name">{item.name}</span>
                <span class="vp-type">{item.type}</span>
              </span>
              <span class="vp-check"><Icon name="i-check" size="2xs" /></span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
