import type { JSX, ParentProps } from "solid-js";
import { Show } from "solid-js";
import { Icon } from "./Icon";

interface PillGridProps extends ParentProps {
  empty?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
}

export function PillGrid(props: PillGridProps): JSX.Element {
  return (
    <div class="pill-grid">
      <Show when={!props.empty} fallback={
        <div class="pill-grid-empty">
          {props.emptyIcon && <Icon name={props.emptyIcon} />}
          <span>{props.emptyMessage ?? "No items found"}</span>
        </div>
      }>
        {props.children}
      </Show>
    </div>
  );
}
