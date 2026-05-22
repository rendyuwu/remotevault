import { onMount } from "solid-js";
import iconsSvg from "./assets/icons.svg?raw";

export function IconSprite() {
  let container!: HTMLDivElement;
  onMount(() => {
    container.innerHTML = iconsSvg;
  });
  return <div class="icon-sprite" ref={container} />;
}
