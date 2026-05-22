import type { JSX } from "solid-js";
import { Icon } from "./Icon";

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

interface BtnBaseProps {
  variant?: BtnVariant;
  size?: BtnSize;
  type?: "button" | "submit" | "reset";
  icon?: string;
  block?: boolean;
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children?: JSX.Element;
}

type BtnProps = BtnBaseProps & (
  | { iconOnly: true; ariaLabel: string }
  | { iconOnly?: false; ariaLabel?: string }
);

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
    <button
      type={props.type ?? "button"}
      class={cls()}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      onClick={props.onClick}
    >
      {props.icon && <Icon name={props.icon} size={props.size === "sm" ? "xs" : "sm"} />}
      {props.children}
    </button>
  );
}
