interface ToggleProps {
  on: boolean;
  label?: string;
  onChange: (value: boolean) => void;
}

export function Toggle(props: ToggleProps) {
  return (
    <label class={`toggle${props.on ? " on" : ""}`} onClick={() => props.onChange(!props.on)}>
      <span class="toggle-track" />
      {props.label && <span>{props.label}</span>}
    </label>
  );
}
