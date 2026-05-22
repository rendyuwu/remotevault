type Protocol = "ssh" | "rdp";

export function ProtoIcon(props: { protocol: Protocol }) {
  return (
    <div class={`proto-icon ${props.protocol}`}>
      {props.protocol.toUpperCase()}
    </div>
  );
}
