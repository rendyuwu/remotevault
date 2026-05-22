import type { JSX } from "solid-js";

type ChipVariant = "success" | "warning" | "danger" | "info" | "encrypted" | "locked" | "accent" | "ghost" | "mono";

interface ChipProps {
  variant?: ChipVariant;
  dot?: boolean;
  children: JSX.Element;
}

export function Chip(props: ChipProps) {
  const cls = () => {
    const c = ["chip"];
    if (props.variant) c.push(`chip-${props.variant}`);
    return c.join(" ");
  };

  return (
    <span class={cls()}>
      {props.dot && <span class="dot" />}
      {props.children}
    </span>
  );
}
