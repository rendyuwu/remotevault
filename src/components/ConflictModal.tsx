import { For } from "solid-js";
import { Modal } from "./Modal";
import { Btn } from "./Btn";

interface VersionField {
  label: string;
  value: string;
  changed?: boolean;
}

interface ConflictVersion {
  header: string;
  fields: VersionField[];
}

interface ConflictModalProps {
  open: boolean;
  onClose: () => void;
  local: ConflictVersion;
  remote: ConflictVersion;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
  onKeepBoth?: () => void;
  label?: string;
  title?: string;
  copy?: string;
}

export function ConflictModal(props: ConflictModalProps) {
  const label = () => props.label ?? "Resolve Vault Conflict";
  const title = () => props.title ?? "Resolve Vault Conflict";
  const copy = () => props.copy ?? "\"SSH Key Passphrase\" was modified on two devices. For secrets, keeping both versions is the safer default.";

  return (
    <Modal open={props.open} onClose={props.onClose} class="conflict-modal" label={label()}>
      <h3 class="card-title">{title()}</h3>
      <p class="conflict-copy">{copy()}</p>
      <div class="conflict-versions">
        <VersionColumn version={props.local} />
        <VersionColumn version={props.remote} />
      </div>
      <div class="conflict-actions">
        <Btn variant="ghost" onClick={() => props.onKeepLocal()}>Keep Local</Btn>
        <Btn variant="ghost" onClick={() => props.onKeepRemote()}>Keep Remote</Btn>
        <Btn variant="primary" onClick={() => (props.onKeepBoth ?? props.onKeepRemote)()}>Keep Both</Btn>
      </div>
    </Modal>
  );
}

function VersionColumn(props: { version: ConflictVersion }) {
  return (
    <div class="conflict-version">
      <div class="conflict-version-header">{props.version.header}</div>
      <For each={props.version.fields}>
        {(field) => (
          <div class="cv-field">
            <div class="cv-label">{field.label}</div>
            <div class={`cv-value${field.changed ? " cv-changed" : ""}`}>{field.value}</div>
          </div>
        )}
      </For>
    </div>
  );
}
