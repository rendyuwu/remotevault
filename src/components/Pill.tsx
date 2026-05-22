import type { JSX } from "solid-js";
import { Icon } from "./Icon";

interface PillIcon {
  type: string;
  label?: string;
  svg?: string;
}

interface PillProps {
  icon: PillIcon;
  name: string;
  subtitle: string;
  status?: "synced" | "conflict" | "pending" | "local";
  active?: boolean;
  onClick?: () => void;
  onDblClick?: () => void;
  onEdit?: () => void;
}

export function Pill(props: PillProps): JSX.Element {
  return (
    <button type="button" class={`pill${props.active ? " active" : ""}`} onClick={props.onClick} onDblClick={props.onDblClick}>
      <span class={`pill-icon ${props.icon.type}`}>
        {props.icon.svg ? <Icon name={props.icon.svg} size="xs" /> : (props.icon.label ?? props.icon.type.toUpperCase())}
      </span>
      <div class="pill-text">
        <span class="pill-name">{props.name}</span>
        <span class="pill-sub">{props.subtitle}</span>
      </div>
      {props.status && <span class={`pill-status ${props.status}`} />}
      {props.onEdit && (
        <button type="button" class="pill-edit" title="Edit" onClick={(e) => { e.stopPropagation(); props.onEdit!(); }}>
          <Icon name="i-edit" size="xs" />
        </button>
      )}
    </button>
  );
}
