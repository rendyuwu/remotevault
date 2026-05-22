import { onMount, onCleanup, type JSX } from "solid-js";
import { useTopbar } from "./TopbarContext";

interface TitleProps {
  title: string;
  actions?: JSX.Element;
}

export function TopbarTitle(props: TitleProps) {
  const { setTopbar } = useTopbar();
  onMount(() => {
    setTopbar(
      <>
        <span class="topbar-title">{props.title}</span>
        {props.actions && <div class="topbar-actions">{props.actions}</div>}
      </>
    );
  });
  onCleanup(() => setTopbar(null));
  return null;
}

interface BreadcrumbProps {
  parent: { label: string; href: string };
  current: string;
  actions?: JSX.Element;
}

export function TopbarBreadcrumb(props: BreadcrumbProps) {
  const { setTopbar } = useTopbar();
  onMount(() => {
    setTopbar(
      <>
        <div class="topbar-crumbs">
          <a href={props.parent.href}>{props.parent.label}</a>
          <span class="sep">/</span>
          <span class="here">{props.current}</span>
        </div>
        {props.actions && <div class="topbar-actions">{props.actions}</div>}
      </>
    );
  });
  onCleanup(() => setTopbar(null));
  return null;
}
