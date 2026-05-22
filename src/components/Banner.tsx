import type { JSX } from "solid-js";
import { Icon } from "./Icon";

type BannerVariant = "warning" | "danger" | "info" | "accent";

interface BannerProps {
  variant: BannerVariant;
  icon: string;
  title?: string;
  children: JSX.Element;
}

export function Banner(props: BannerProps) {
  return (
    <div class={`banner banner-${props.variant}`}>
      <Icon name={props.icon} />
      <div>
        {props.title && <p class="banner-title">{props.title}</p>}
        <p class="banner-body">{props.children}</p>
      </div>
    </div>
  );
}
