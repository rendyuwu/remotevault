import type { JSX } from "solid-js";

interface IconProps {
  name: string;
  size?: number;
  class?: string;
}

export function Icon(props: IconProps): JSX.Element {
  return (
    <svg
      class={props.class ? `icon ${props.class}` : "icon"}
      width={props.size ?? 16}
      height={props.size ?? 16}
    >
      <use href={`#${props.name}`} />
    </svg>
  );
}
