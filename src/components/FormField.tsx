import type { JSX } from "solid-js";

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: JSX.Element;
}

export function FormField(props: FormFieldProps) {
  return (
    <div class="field">
      <label class={`label${props.required ? " label-required" : ""}`}>
        {props.label}
      </label>
      {props.children}
      {props.hint && <span class="hint">{props.hint}</span>}
    </div>
  );
}
