import type { ParentProps } from "solid-js";
import { IconSprite } from "./IconSprite";

export function App(props: ParentProps) {
  return (
    <div class="app">
      <IconSprite />
      <aside class="sidebar"></aside>
      <main class="main">
        <header class="topbar"></header>
        <div class="content">{props.children}</div>
      </main>
    </div>
  );
}
