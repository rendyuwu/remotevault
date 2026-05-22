import type { ParentProps } from "solid-js";

export function App(props: ParentProps) {
  return (
    <div class="app">
      <aside class="sidebar"></aside>
      <main class="main">
        <header class="topbar"></header>
        <div class="content">{props.children}</div>
      </main>
    </div>
  );
}
