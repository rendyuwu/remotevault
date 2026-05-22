import { createEffect, onCleanup, type JSX } from "solid-js";
import { A } from "@solidjs/router";
import { useTopbar } from "./TopbarContext";

interface TitleProps {
  title: string;
  actions?: JSX.Element;
}

export function TopbarTitle(props: TitleProps) {
  const { setTopbar } = useTopbar();
  createEffect(() => {
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
  createEffect(() => {
    setTopbar(
      <>
        <div class="topbar-crumbs">
          <A href={props.parent.href}>{props.parent.label}</A>
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
