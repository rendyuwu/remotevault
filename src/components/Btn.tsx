import type { JSX } from "solid-js";
import { Icon } from "./Icon";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: string;
  iconOnly?: boolean;
  block?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children?: JSX.Element;
}

export function Btn(props: BtnProps) {
  const cls = () => {
    const c = ["btn"];
    if (props.variant) c.push(`btn-${props.variant}`);
    if (props.size && props.size !== "md") c.push(`btn-${props.size}`);
    if (props.iconOnly) c.push("btn-icon");
    if (props.block) c.push("btn-block");
    return c.join(" ");
  };

  return (
    <button class={cls()} disabled={props.disabled} onClick={props.onClick}>
      {props.icon && <Icon name={props.icon} size={props.size === "sm" ? 13 : 16} />}
      {props.children}
    </button>
  );
}
