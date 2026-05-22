import { For } from "solid-js";

type StepState = "done" | "current" | "upcoming";

interface StepsProps {
  steps: StepState[];
  label?: string;
}

export function Steps(props: StepsProps) {
  return (
    <div class="steps">
      <For each={props.steps}>
        {(state) => <span class={`dot${state !== "upcoming" ? ` ${state}` : ""}`} />}
      </For>
      {props.label && <span>{props.label}</span>}
    </div>
  );
}
