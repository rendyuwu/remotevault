import type { JSX } from "solid-js";

interface CardProps {
  title?: string;
  desc?: string;
  actions?: JSX.Element;
  children: JSX.Element;
}

export function Card(props: CardProps) {
  return (
    <div class="card">
      {(props.title || props.actions) && (
        <div class="card-header">
          <div>
            {props.title && <h3 class="card-title">{props.title}</h3>}
            {props.desc && <p class="card-desc">{props.desc}</p>}
          </div>
          {props.actions}
        </div>
      )}
      {props.children}
    </div>
  );
}

export function CardSection(props: { children: JSX.Element }) {
  return <div class="card-section">{props.children}</div>;
}
