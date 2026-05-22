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
          <Icon name="i-key" size={14} />
          Linked Secrets
        </h4>
      </div>
      <div class="vault-picker-list">
        <For each={props.items}>
          {(item) => (
            <div
              class={`vault-picker-item${item.id === props.selectedId ? " selected" : ""}`}
              onClick={() => props.onSelect(item.id)}
            >
              <span class="vp-icon"><Icon name={item.icon} size={12} /></span>
              <div>
                <div class="vp-name">{item.name}</div>
                <div class="vp-type">{item.type}</div>
              </div>
              <span class="vp-check"><Icon name="i-check" size={10} /></span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
