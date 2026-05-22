interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterChip(props: FilterChipProps) {
  return (
    <button
      type="button"
      class={`proto-chip${props.active ? " active" : ""}`}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  );
}
