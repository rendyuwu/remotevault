import { createUniqueId, type JSX } from "solid-js";

interface FormFieldControl {
  id: string;
  describedBy?: string;
}

interface FormFieldProps {
  label: string;
  id?: string;
  required?: boolean;
  hint?: string;
  children: (field: FormFieldControl) => JSX.Element;
}

export function FormField(props: FormFieldProps) {
  const fallbackId = createUniqueId();
  const fieldId = () => props.id ?? fallbackId;
  const hintId = () => props.hint ? `${fieldId()}-hint` : undefined;

  return (
    <div class="field">
      <label class={`label${props.required ? " label-required" : ""}`} for={fieldId()}>
        {props.label}
      </label>
      {props.children({ id: fieldId(), describedBy: hintId() })}
      {props.hint && <span class="hint" id={hintId()}>{props.hint}</span>}
    </div>
  );
}
