import type { JSX } from "solid-js";

type IconSize = "2xs" | "xs" | "sm";

interface IconProps {
  name: string;
  size?: IconSize;
  class?: string;
}

export function Icon(props: IconProps): JSX.Element {
  const cls = () => ["icon", props.size && `icon-${props.size}`, props.class].filter(Boolean).join(" ");

  return (
    <svg class={cls()} aria-hidden="true">
      <use href={`#${props.name}`} />
    </svg>
  );
}
